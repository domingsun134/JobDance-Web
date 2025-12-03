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
    <div className="min-h-screen flex items-center justify-center px-4 py-4 sm:py-8 bg-black relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-in-up">
        {/* Logo and Welcome Section */}
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-5 animate-fade-in text-white" style={{ animationDelay: "0.1s" }}>
            Welcome to
          </h1>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Logo />
          </div>
          <p className="text-gray-400 text-sm sm:text-base font-medium animate-fade-in mt-4 sm:mt-6" style={{ animationDelay: "0.3s" }}>
            Your AI-powered career advisor
          </p>
        </div>


        {/* Form Content Container */}
        <div className="min-h-[200px] sm:min-h-[280px] relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
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
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <Link
          href="/auth/register"
          className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 animate-fade-in mt-4"
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
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
