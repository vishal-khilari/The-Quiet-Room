import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch Playfair Display (TTF) from Google Fonts GitHub repo for Satori compatibility
    const fontData = await fetch(
      new URL('https://github.com/googlefonts/PlayfairDisplay/raw/main/fonts/ttf/PlayfairDisplay-Regular.ttf')
    ).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch font');
      return res.arrayBuffer();
    });

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0e0e0e',
            fontFamily: '"Playfair Display", serif',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              color: '#d1d5db',
              marginBottom: '48px',
            }}
          >
            The Quiet Room
          </div>
          
          {/* Subtle horizontal line */}
          <div
            style={{
              width: '120px',
              height: '1px',
              backgroundColor: '#1f1f1f',
              marginBottom: '48px',
            }}
          />
          
          <div
            style={{
              fontSize: '32px',
              color: '#52525b',
              fontStyle: 'italic',
            }}
          >
            Say what you cannot say out loud.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: fontData,
            style: 'normal',
          },
        ],
      }
    );
  } catch (e: unknown) {
    console.error('OG Image Generation Error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
