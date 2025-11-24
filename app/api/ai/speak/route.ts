import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/aws';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const audioBuffer = await synthesizeSpeech(text, voiceId || 'Ruth');

    // Convert Buffer to Uint8Array for NextResponse
    // NextResponse accepts Uint8Array, ArrayBuffer, or ReadableStream
    // Using Uint8Array is the most compatible approach
    const uint8Array = new Uint8Array(audioBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error synthesizing speech:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}

