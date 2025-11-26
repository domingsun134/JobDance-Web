import { NextRequest, NextResponse } from 'next/server';
import { chatWithResumeBuilder } from '@/lib/aws';
import { getCurrentUser, getUserProfile, updateUserProfile, UserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { messages, currentProfile } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Get current user
        // Note: In a real API route, we'd need to handle auth context properly.
        // Since we're using client-side auth tokens, we might need to pass the session or rely on Supabase auth helper for Next.js
        // For now, we'll assume the client sends the request and we can verify the user via Supabase.

        // However, `getCurrentUser` uses `supabase.auth.getUser()` which works on client side or if cookie is set.
        // In API route, we should create a server-side client.
        // But `lib/auth.ts` uses a client-side `supabase` instance.
        // To make this work in API route without refactoring everything, we'll assume the user is authenticated 
        // and we might need to pass the user ID or rely on the fact that we are calling this from the client 
        // and the `supabase` client in `lib/supabase.ts` might not have the session if it's just a static createClient.

        // CRITICAL FIX: The `lib/supabase.ts` exports a client created with `createClient`.
        // In Next.js App Router API routes, we should use `createServerClient` from `@supabase/ssr` or similar, 
        // or pass the access token.
        // For simplicity in this prototype, we'll try to get the user from the request headers or cookies if possible,
        // but `lib/auth.ts` functions are designed for client-side.

        // WORKAROUND: We will pass the `userId` in the request body for this prototype since we are running locally.
        // In production, strictly use HttpOnly cookies and server-side auth validation.

        // Actually, let's try to get the user from the auth header if sent by the client.
        // If not, we might fail.

        // Let's assume the client sends the user profile data in the request body to avoid server-side fetching issues for now,
        // OR we can just use the `chatWithResumeBuilder` and return the data, and let the CLIENT update the DB.
        // That might be safer and easier given the current architecture where `lib/auth.ts` is client-side focused.

        // DECISION: The API will be stateless regarding DB updates for now. 
        // It will take the current profile state from the client, calculate the new state, and return it.
        // The CLIENT will be responsible for saving it to Supabase using `updateUserProfile`.
        // This avoids duplicating auth logic on the server side and avoids permission issues.

        // Wait, the plan said "Update Supabase tables... if valid data is extracted".
        // If I do it on client, it's easier.
        // Let's stick to the plan but move the DB update responsibility to the client for simplicity in this specific codebase context.
        // So this API will just be the "Brain".

        // Call Bedrock
        const { response, extractedData } = await chatWithResumeBuilder(messages, currentProfile);

        return NextResponse.json({
            response,
            extractedData
        });

    } catch (error: any) {
        console.error('Error in resume chat API:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
