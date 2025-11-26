"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      if (user.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 sm:py-8 bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-gray-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in-up">
        {/* Logo and Welcome Section */}
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold gradient-text mb-3 sm:mb-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Welcome to
          </h1>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Logo />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium animate-fade-in mt-4 sm:mt-6" style={{ animationDelay: "0.3s" }}>
            Your AI-powered career advisor
          </p>
        </div>


        {/* Form Content Container - Fixed height to prevent layout shift */}
        <div className="min-h-[200px] sm:min-h-[280px] relative">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Email Login */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base shadow-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base shadow-sm"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <Link
          href="/auth/register"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 animate-fade-in mt-2 sm:mt-4"
          style={{ animationDelay: "0.5s" }}
        >
          <span>Don't have an account? Sign up</span>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Footer */}
        <p className="mt-4 sm:mt-8 text-center text-xs text-gray-500 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
