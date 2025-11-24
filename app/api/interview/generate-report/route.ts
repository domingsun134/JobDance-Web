import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewReport } from '@/lib/aws';
import { getServerUser, getServerUserProfile } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      console.error('Unauthorized: No user found. Auth header:', request.headers.get('authorization') ? 'Present' : 'Missing');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const { messages, duration } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get user profile for context
    const userProfile = await getServerUserProfile(user.id);

    const report = await generateInterviewReport(messages, userProfile, duration);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

