"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser, signInWithLinkedIn } from "@/lib/auth";
import { FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import Logo from "@/components/Logo";

type LoginMethod = "social" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>("social");
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

  const handleSocialLogin = async (provider: "google" | "linkedin") => {
    setError("");
    setLoading(true);
    
    try {
      if (provider === "linkedin") {
        await signInWithLinkedIn();
        // The redirect will happen automatically, so we don't need to do anything else
      } else {
        // Google OAuth can be added later
        setError("Google login is not yet available");
        setLoading(false);
      }
    } catch (err: any) {
      let errorMessage = err.message || `Failed to login with ${provider}`;
      
      // Provide more helpful error message for LinkedIn
      if (provider === "linkedin" && (errorMessage.includes("not enabled") || errorMessage.includes("Unsupported provider"))) {
        errorMessage = "LinkedIn login is not enabled. Please enable it in the Supabase dashboard under Authentication → Providers → LinkedIn.";
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 sm:py-8 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
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
          <p className="text-gray-400 text-sm sm:text-base font-medium animate-fade-in mt-4 sm:mt-6" style={{ animationDelay: "0.3s" }}>
            Sign in to continue your job search journey
          </p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex gap-2 mb-6 sm:mb-8 glass-dark p-1.5 rounded-2xl border border-white/10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <button
            type="button"
            onClick={() => setMethod("social")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              method === "social"
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Social
          </button>
          <button
            type="button"
            onClick={() => setMethod("email")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              method === "email"
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FiMail className="text-base" />
            Email
          </button>
        </div>

        {/* Form Content Container - Fixed height to prevent layout shift */}
        <div className="min-h-[200px] sm:min-h-[280px] relative">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Social Login */}
          {method === "social" && (
            <div className="space-y-3 animate-fade-in">
              <button
                onClick={() => handleSocialLogin("google")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
              >
                <FcGoogle className="text-xl sm:text-2xl bg-white rounded-full p-0.5" />
                <span>Continue with Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin("linkedin")}
                disabled={loading}
                className="w-full bg-[#0077b5] hover:bg-[#006399] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-[#0077b5]/30 hover:shadow-[#0077b5]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaLinkedin className="text-xl sm:text-2xl" />
                <span>{loading ? "Connecting..." : "Continue with LinkedIn"}</span>
              </button>
            </div>
          )}

          {/* Email Login */}
          {method === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
              <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
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
          )}
        </div>

        {/* Separator */}
        {method === "social" && (
          <div className="relative my-3 sm:my-4 animate-fade-in">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>
        )}

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
          <a href="#" className="text-blue-400 hover:text-blue-300 underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-400 hover:text-blue-300 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
