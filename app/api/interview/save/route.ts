import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getAuthenticatedSupabaseClient } from '@/lib/auth-server';

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

    const { sessionData, report, duration, videoUrl } = await request.json();

    // Get the auth token from the request to create an authenticated Supabase client
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Create a Supabase client with the user's session token for RLS evaluation
    const supabase = getAuthenticatedSupabaseClient(token);

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        session_data: sessionData,
        report: report,
        duration_seconds: duration,
        video_url: videoUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ session: data });
  } catch (error: any) {
    console.error('Error saving interview session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save interview session' },
      { status: 500 }
    );
  }
}

