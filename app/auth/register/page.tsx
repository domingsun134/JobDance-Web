"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to continue");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await registerUser(email, password);
      setSuccessMessage("Account created! Please confirm your email before signing in.");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!successMessage) return;

    const timeout = setTimeout(() => {
      router.push("/auth/login");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router, successMessage]);

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
        <div className="mb-4 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Welcome to
          </h1>
          <Logo />
          <p className="text-gray-400 text-xs sm:text-sm animate-fade-in mt-2 sm:mt-4" style={{ animationDelay: "0.2s" }}>
            Your AI-powered career advisor
          </p>
        </div>


        {/* Form Content Container */}
        <div className="min-h-[240px] sm:min-h-[360px] relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm animate-fade-in">
              {successMessage}
            </div>
          )}

          {/* Email Register */}
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
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
                placeholder="Confirm your password"
              />
            </div>

            {/* Terms Acceptance Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 mr-2 flex-shrink-0 accent-purple-500"
              />
              <label htmlFor="acceptTerms" className="text-xs sm:text-sm text-gray-400 cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms || Boolean(successMessage)}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <Link
          href="/auth/login"
          className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 animate-fade-in mt-4"
          style={{ animationDelay: "0.5s" }}
        >
          <span>Already have an account? Sign in</span>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>


      </div>
    </div>
  );
}
