import { NextRequest, NextResponse } from 'next/server';
import { validateAnswerWithAI } from '@/lib/aws';

export async function POST(request: NextRequest) {
    try {
        const { question, answer } = await request.json();

        if (!question || !answer) {
            return NextResponse.json(
                { error: 'Question and answer are required' },
                { status: 400 }
            );
        }

        const result = await validateAnswerWithAI(question, answer);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to validate answer' },
            { status: 500 }
        );
    }
}
