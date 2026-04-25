import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthClient } from '@/lib/google';
import { Readable } from 'stream';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return new NextResponse('Missing ID', { status: 400 });

    const auth = getOAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' }
    );

    const webStream = Readable.toWeb(response.data as unknown as import('stream').Readable);

    return new NextResponse(webStream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'audio/webm',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return new NextResponse('Audio not found', { status: 404 });
  }
}
