import { NextRequest, NextResponse } from 'next/server';
import { uploadVideoToS3 } from '@/lib/aws';
import { getServerUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    // Check if S3 bucket is configured
    if (!process.env.AWS_S3_BUCKET_NAME) {
      console.warn('AWS_S3_BUCKET_NAME not configured, skipping video upload');
      return NextResponse.json(
        { error: 'Video storage not configured', url: null },
        { status: 503 }
      );
    }

    const sessionId = formData.get('sessionId') as string || Date.now().toString();
    const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: 'video/webm' });

    // Check file size (limit to 100MB)
    if (videoBlob.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video file too large (max 100MB)' },
        { status: 400 }
      );
    }

    const videoUrl = await uploadVideoToS3(videoBlob, user.id, sessionId);

    return NextResponse.json({ url: videoUrl });
  } catch (error: any) {
    console.error('Error uploading video:', error);
    // Return a more specific error message
    const errorMessage = error.message || 'Failed to upload video';
    return NextResponse.json(
      { error: errorMessage, url: null },
      { status: 500 }
    );
  }
}

