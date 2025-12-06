import { NextResponse } from "next/server";
import { optimizeResumeWithBedrock } from "@/lib/aws";

export async function POST(req: Request) {
    try {
        const { currentProfile, jobTitle, jobDescription } = await req.json();

        if (!currentProfile || !jobTitle || !jobDescription) {
            return NextResponse.json({ error: "Missing required data" }, { status: 400 });
        }


        const result = await optimizeResumeWithBedrock(currentProfile, jobTitle, jobDescription);

        // Handle both old (direct profile) and new ({ optimizedProfile, optimizationSummary }) formats
        const optimizedProfile = result.optimizedProfile || result;
        const optimizationSummary = result.optimizationSummary || "";

        return NextResponse.json({ optimizedProfile, optimizationSummary });

    } catch (error) {
        console.error("Optimization error:", error);
        return NextResponse.json({ error: "Failed to optimize resume" }, { status: 500 });
    }
}
