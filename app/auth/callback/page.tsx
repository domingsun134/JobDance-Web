"use client";

import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-2 bg-black relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
            backgroundSize: "140px 140px",
          }}
        />
        <div className="absolute -top-32 -left-10 h-96 w-96 rounded-full bg-purple-500/30 blur-[140px]" />
        <div className="absolute bottom-0 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[200px]" />
      </div>
      <div className="w-full max-w-md relative z-10 animate-slide-in-up">{children}</div>
    </div>
  );
}

type AuthStatusCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function AuthStatusCard({ title, subtitle, children }: AuthStatusCardProps) {
  return (
    <AuthBackground>
      <div className="mb-4 text-center">
        <h1
          className="text-2xl sm:text-3xl font-bold text-white mb-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {title}
        </h1>
        <Logo />
        <p
          className="text-gray-400 text-xs sm:text-sm animate-fade-in mt-2"
          style={{ animationDelay: "0.2s" }}
        >
          {subtitle}
        </p>
      </div>
      <div className="relative p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">{children}</div>
    </AuthBackground>
  );
}

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
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError || !session) {
            throw new Error("No authorization code received and no active session found");
          }
        }

        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

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
      <AuthStatusCard title="Authentication issue" subtitle="Your AI-powered career advisor">
        <div className="space-y-4 text-center animate-fade-in">
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95"
          >
            Return to Login
          </button>
        </div>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard title="Finishing sign in" subtitle="Your AI-powered career advisor">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in" aria-live="polite">
        <div className="w-14 h-14 border-4 border-purple-500/60 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-200 text-sm sm:text-base">Completing authentication...</p>
      </div>
    </AuthStatusCard>
  );
}

function AuthSuspenseFallback() {
  return (
    <AuthStatusCard title="Preparing sign in" subtitle="Your AI-powered career advisor">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in" aria-live="polite">
        <div className="w-14 h-14 border-4 border-purple-500/60 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-200 text-sm sm:text-base">Loading...</p>
      </div>
    </AuthStatusCard>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthSuspenseFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

