import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/aws';
import { getServerUser, getServerUserProfile } from '@/lib/auth-server';

// Helper function to add timeout to a promise (local to this file)
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

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
    // Add timeout protection for mobile devices (5 seconds max for auth + profile loading)
    let userProfile = null;
    try {
      // Wrap auth and profile loading in a timeout to prevent hanging on mobile
      const profilePromise = (async () => {
        const user = await getServerUser(request);
        if (user) {
          console.log('Authenticated user found:', user.id, user.email);
          const profile = await getServerUserProfile(user.id);
          if (profile) {
            console.log('Successfully loaded user profile for AI context');
            return profile;
          } else {
            console.warn('User profile data is empty or not found for user:', user.id);
          }
        } else {
          console.warn('No authenticated user found - this is non-critical, continuing without profile');
        }
        return null;
      })();

      // Use timeout to prevent hanging (5 seconds for auth + profile loading)
      userProfile = await withTimeout(
        profilePromise,
        5000,
        'Profile loading timed out (continuing without profile)'
      );
    } catch (error: any) {
      // If timeout or other error, continue without profile - this is non-critical
      if (error.message?.includes('timed out')) {
        console.warn('Profile loading timed out - continuing without profile for faster response');
      } else {
        console.error('Error loading user profile for AI context:', error.message || error);
      }
      // Continue without profile - AI can still work without it
    }

    console.log('Calling getAIResponse...');
    
    // Add timeout protection for the AI response generation (25 seconds max)
    // This ensures the API responds even if Bedrock is slow
    const aiResponsePromise = getAIResponse(messages, userProfile, isClosing);
    const response = await withTimeout(
      aiResponsePromise,
      25000,
      'AI response generation timed out'
    );
    
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
    
    // If it's a timeout, return a more helpful error message
    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again or check your connection.' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

