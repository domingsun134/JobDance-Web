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

    // Get user profile for context (with timeout protection)
    // If profile loading fails or times out, continue without it - report generation can work without profile
    let userProfile = null;
    try {
      userProfile = await getServerUserProfile(user.id);
      if (!userProfile) {
        console.warn('User profile not found or empty - continuing without profile for report generation');
      }
    } catch (profileError: any) {
      // If profile loading fails (timeout, network error, etc.), continue without it
      if (profileError.message?.includes('timed out')) {
        console.warn('Profile loading timed out - continuing without profile for report generation');
      } else {
        console.error('Error loading user profile for report context:', profileError.message || profileError);
      }
      // Continue without profile - report generation can work without it
      userProfile = null;
    }

    // Generate report (this can take a while, but has its own timeout handling)
    const report = await generateInterviewReport(messages, userProfile, duration);

    // Validate report structure
    if (!report || (typeof report === 'object' && Object.keys(report).length === 0)) {
      console.error('Report generation returned empty/null report');
      return NextResponse.json(
        { error: 'Report generation returned empty result. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) // Limit stack trace length
    });
    
    // Provide more specific error messages
    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { error: 'Report generation timed out. The interview was too long or the service is busy. Please try again.' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
      return NextResponse.json(
        { error: 'Service is currently busy. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}

