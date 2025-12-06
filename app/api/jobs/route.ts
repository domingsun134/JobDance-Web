import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { company_name, position_title, job_url, status, salary_range, notes } = body;

        if (!company_name || !position_title) {
            return NextResponse.json(
                { error: "Company name and position title are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("job_applications")
            .insert({
                user_id: user.id,
                company_name,
                position_title,
                job_url,
                status: status || 'applied',
                salary_range,
                notes,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating job application:", error);
            return NextResponse.json({ error: "Failed to create job application" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("job_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching job applications:", error);
            return NextResponse.json({ error: "Failed to fetch job applications" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in GET /api/jobs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
