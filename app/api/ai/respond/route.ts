import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/aws';
import { getServerUser, getServerUserProfile } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { messages, isClosing } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get user profile for context using server-side functions
    let userProfile = null;
    try {
      const user = await getServerUser(request);
      if (user) {
        console.log('Authenticated user found:', user.id, user.email);
        userProfile = await getServerUserProfile(user.id);
        if (userProfile) {
          console.log('Successfully loaded user profile for AI context');
        } else {
          console.warn('User profile data is empty or not found for user:', user.id);
        }
      } else {
        console.warn('No authenticated user found - this is non-critical, continuing without profile');
      }
    } catch (error: any) {
      console.error('Error loading user profile for AI context:', error.message || error);
      // Continue without profile if auth fails - this is non-critical
    }

    const response = await getAIResponse(messages, userProfile, isClosing);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error getting AI response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

