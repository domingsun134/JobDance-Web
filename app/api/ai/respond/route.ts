import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/aws';
import { getServerUser, getServerUserProfile } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('Received AI respond request');
    const { messages, isClosing } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request: messages array is required');
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log(`Processing ${messages.length} messages, isClosing: ${isClosing}`);

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

    console.log('Calling getAIResponse...');
    const response = await getAIResponse(messages, userProfile, isClosing);
    const duration = Date.now() - startTime;
    console.log(`AI response generated in ${duration}ms`);

    if (!response || response.trim() === '') {
      console.error('Empty response from AI');
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`Error getting AI response after ${duration}ms:`, error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

