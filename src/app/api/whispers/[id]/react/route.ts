import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';

const REACTION_MAP: Record<string, string> = {
  'felt this': 'felt-this',
  'not alone': 'not-alone',
  'i understand': 'understand',
  'felt-this': 'felt-this',
  'not-alone': 'not-alone',
  'understand': 'understand',
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new NextResponse('Missing whisper ID', { status: 400 });
    }

    const body = await req.json();
    // Support both the prompted 'reaction' and the frontend's 'type'
    const rawReaction = body.reaction || body.type;
    const reactionKey = typeof rawReaction === 'string' ? REACTION_MAP[rawReaction] : null;

    if (!reactionKey) {
      return new NextResponse('Invalid reaction type', { status: 400 });
    }

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Read the sheet to find the row
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:E',
    });

    const rows = getRes.data.values;
    if (!rows || rows.length === 0) {
      return new NextResponse('No data found', { status: 404 });
    }

    let rowIndex = -1;
    let currentRow: string[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i;
        currentRow = rows[i] as string[];
        break;
      }
    }

    if (rowIndex === -1) {
      return new NextResponse('Whisper not found', { status: 404 });
    }

    // Parse existing reactions (Column E is index 4)
    let reactions: Record<string, number> = { 'felt-this': 0, 'not-alone': 0, 'understand': 0 };
    if (currentRow[4]) {
      try {
        const parsed = JSON.parse(currentRow[4]) as Record<string, number>;
        reactions = { ...reactions, ...parsed };
      } catch {
        // stick to default
      }
    }

    // Increment the matching reaction
    reactions[reactionKey] = (reactions[reactionKey] || 0) + 1;

    // The row in A1 notation is rowIndex + 1 (array is 0-indexed, sheets are 1-indexed)
    const cellRange = `Sheet1!E${rowIndex + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[JSON.stringify(reactions)]]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add reaction:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
