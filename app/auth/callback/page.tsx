"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL parameters
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          throw new Error(errorDescription || errorParam || "Authentication failed");
        }

        // Get the code from URL parameters (Supabase OAuth uses query params)
        const code = searchParams.get("code");
        
        if (code) {
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw new Error(exchangeError.message || "Failed to complete authentication");
          }

          if (!data.session || !data.user) {
            throw new Error("Failed to create session");
          }
        } else {
          // If no code, try to get the session directly (in case Supabase handled it automatically)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error("No authorization code received and no active session found");
          }
        }

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Failed to get user information");
        }

        // Check if user profile exists and onboarding status
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        // If profile doesn't exist, create it
        if (profileError && profileError.code === "PGRST116") {
          const { error: createError } = await supabase.from("user_profiles").insert({
            id: user.id,
            email: user.email || "",
            onboarding_completed: false,
          });

          if (createError) {
            console.error("Error creating profile:", createError);
          }

          // Redirect to onboarding for new users
          router.push("/onboarding");
          return;
        }

        // Redirect based on onboarding status
        if (profile?.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="mt-8 glass-dark rounded-3xl shadow-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <div className="w-full max-w-md text-center">
        <Logo />
        <div className="mt-8 glass-dark rounded-3xl shadow-2xl p-8 border border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 text-lg">Completing authentication...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
          <div className="w-full max-w-md text-center">
            <Logo />
            <div className="mt-8 glass-dark rounded-3xl shadow-2xl p-8 border border-white/10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-300 text-lg">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

