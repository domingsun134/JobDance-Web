import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, getAuthenticatedSupabaseClient } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const { sessionId, report } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report is required' },
        { status: 400 }
      );
    }

    // Get the auth token from the request
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

    // Update the session with the report
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({ report: report })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ session: data });
  } catch (error: any) {
    console.error('Error updating interview session report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update interview session report' },
      { status: 500 }
    );
  }
}



