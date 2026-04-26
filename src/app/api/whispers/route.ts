import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth, getOAuthClient } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ipPostTimes = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const tenMins = 600000;

    // Clean up old entries
    for (const [key, times] of ipPostTimes.entries()) {
      const recentTimes = times.filter(t => now - t < tenMins);
      if (recentTimes.length === 0) {
        ipPostTimes.delete(key);
      } else {
        ipPostTimes.set(key, recentTimes);
      }
    }

    const userTimes = ipPostTimes.get(ip) || [];
    if (userTimes.length >= 3) {
      return NextResponse.json({ error: 'Too many whispers. Rest a moment.' }, { status: 429 });
    }

    userTimes.push(now);
    ipPostTimes.set(ip, userTimes);

    const body = await req.json();
    const { text, pseudonym, audioBase64 } = body;
    
    const finalPseudonym = pseudonym?.trim() || 'Anonymous';
    
    let audioUrl = '';
    if (audioBase64) {
      const auth = getOAuthClient();
      const drive = google.drive({ version: 'v3', auth });
      const buffer = Buffer.from(audioBase64.split(',')[1], 'base64');
      
      const driveRes = await drive.files.create({
        requestBody: {
          name: `whisper-${Date.now()}.webm`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
        },
        media: {
          mimeType: 'audio/webm',
          body: Readable.from(buffer),
        },
        fields: 'id',
      });

      const audioFileId = driveRes.data.id || '';
      
      // Make the file publicly readable
      await drive.permissions.create({
        fileId: audioFileId,
        requestBody: { role: 'reader', type: 'anyone' },
      });
      
      audioUrl = `/api/audio/${audioFileId}`;
    }

    // Append the record to Google Sheets
    const authSheets = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth: authSheets });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          crypto.randomUUID(), 
          new Date().toISOString(), 
          finalPseudonym, 
          text, 
          JSON.stringify({ "felt-this": 0, "not-alone": 0, "understand": 0 }),
          audioUrl,
          ''
        ]]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown>;
    console.error('=== WHISPER POST FAILED ===');
    console.error('Message:', errObj.message);
    console.error('Code:', errObj.code);
    console.error('Status:', errObj.status);
    console.error('Full:', JSON.stringify(errObj, Object.getOwnPropertyNames(errObj)));
    console.error('=== END ERROR ===');
    return NextResponse.json({ error: 'Failed to release whisper to the void.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ whispers: [] });
    }

    // Skip the header row (index 0)
    const dataRows = rows.slice(1);
    
    // Map rows to objects
    const whispers = dataRows.map(row => {
      const [id, timestamp, author, text, reactionsStr, audioUrl] = row;
      let reactions = {};
      try {
        reactions = reactionsStr ? JSON.parse(reactionsStr) : {};
      } catch {
        reactions = {};
      }
      
      return {
        id: id || '',
        timestamp: timestamp || '',
        createdAt: timestamp || '',
        author: author || '',
        pseudonym: author || '',
        text: text || '',
        audioUrl: audioUrl || '',
        reactions
      };
    });

    // Sort by timestamp descending (newest first)
    whispers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return max 50 whispers
    const limitedWhispers = whispers.slice(0, 50);

    return NextResponse.json({ whispers: limitedWhispers });
  } catch (error) {
    console.error('Failed to fetch whispers:', error);
    return NextResponse.json({ error: 'Failed to fetch whispers.' }, { status: 500 });
  }
}
