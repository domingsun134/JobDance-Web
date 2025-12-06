import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/aws';

export async function POST(req: NextRequest) {
    try {
        const { userProfile, jobDescription } = await req.json();

        if (!userProfile) {
            return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
        }

        console.log('Generating cover letter for:', userProfile.personalInfo?.fullName);
        const coverLetter = await generateCoverLetter(userProfile, jobDescription);

        return NextResponse.json({ coverLetter });

    } catch (error: any) {
        console.error('Error generating cover letter:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
