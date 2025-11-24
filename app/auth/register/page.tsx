"use client";

import { useState } from "react";
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 sm:py-8 bg-gray-900">
      <div className="w-full max-w-md animate-slide-in-up">
        {/* Logo and Welcome Section */}
        <div className="mb-4 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Welcome to
          </h1>
          <Logo />
          <p className="text-gray-400 text-xs sm:text-sm animate-fade-in mt-2 sm:mt-4" style={{ animationDelay: "0.2s" }}>
            Create your account to start your job search journey
          </p>
        </div>


        {/* Form Content Container - Fixed height to prevent layout shift */}
        <div className="min-h-[240px] sm:min-h-[360px] relative">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
              {error}
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
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-sm sm:text-base"
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
                  className="mt-1 mr-2 flex-shrink-0"
                />
                <label htmlFor="acceptTerms" className="text-xs sm:text-sm text-gray-400 cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
        </div>

        {/* Sign In Link */}
        <Link
          href="/auth/login"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 animate-fade-in mt-2 sm:mt-4"
          style={{ animationDelay: "0.5s" }}
        >
          <span>Already have an account? Sign in</span>
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
