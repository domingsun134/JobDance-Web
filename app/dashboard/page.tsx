"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getUserProfile, logoutUser, type User, type UserProfile } from "@/lib/auth";
import { FiLogOut, FiBriefcase, FiBook, FiCode, FiGlobe, FiCalendar, FiDollarSign, FiEdit3 } from "react-icons/fi";
import { formatDateRange } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        if (!currentUser.onboardingCompleted) {
          router.push("/onboarding");
          return;
        }
        setUser(currentUser);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/auth/login");
  };

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-24 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10 animate-fade-in card-hover">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Welcome back!
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-gray-400 text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105 border border-gray-700/50"
            >
              <FiLogOut className="text-lg" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-primary-500/20 animate-fade-in card-hover" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl border border-primary-500/30">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
          </div>
          <Link
            href="/interview"
            className="group relative block w-full py-5 px-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white rounded-2xl text-center font-semibold hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 transition-all duration-300 shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 active:scale-[0.98] transform overflow-hidden mb-4"
          >
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-3 text-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start AI Interview Practice
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link
            href="/interview/reports"
            className="group block w-full py-4 px-6 glass rounded-xl text-center font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-primary-500/30 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Interview Reports
            </span>
          </Link>
        </div>

        {/* Profile Summary */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 border border-white/10 animate-fade-in card-hover" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Your Profile</h2>
            </div>
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
            >
              <FiEdit3 className="text-base" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Work Experience */}
            {profile.workExperience.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30">
                    <FiBriefcase className="text-amber-400 text-xl" />
                  </div>
                  <h3 className="font-bold text-white text-xl">Work Experience</h3>
                </div>
                <div className="space-y-4">
                  {profile.workExperience.map((exp) => (
                    <div key={exp.id} className="glass rounded-2xl p-6 border-l-4 border-amber-500/50 hover:border-amber-500 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-white text-lg mb-1">{exp.position}</p>
                          <p className="text-gray-300 text-sm font-medium">{exp.company}</p>
                        </div>
                        {exp.current && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium mb-3">
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                    <FiBook className="text-purple-400 text-xl" />
                  </div>
                  <h3 className="font-bold text-white text-xl">Education</h3>
                </div>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="glass rounded-2xl p-6 border-l-4 border-purple-500/50 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-white text-lg mb-1">{edu.degree} in {edu.field}</p>
                          <p className="text-gray-300 text-sm font-medium">{edu.institution}</p>
                        </div>
                        {edu.current && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
                    <FiCode className="text-cyan-400 text-xl" />
                  </div>
                  <h3 className="font-bold text-white text-xl">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 rounded-xl text-sm font-semibold border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-gradient-to-r hover:from-cyan-600/30 hover:to-blue-600/30 transition-all duration-200 hover:scale-105 shadow-lg shadow-cyan-500/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/30">
                    <FiGlobe className="text-emerald-400 text-xl" />
                  </div>
                  <h3 className="font-bold text-white text-xl">Languages</h3>
                </div>
                <div className="space-y-3">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className="glass rounded-xl px-6 py-4 flex justify-between items-center hover:shadow-lg transition-all duration-200 border border-white/5">
                      <span className="text-gray-100 font-semibold text-base">{lang.name}</span>
                      <span className="text-xs text-emerald-300 capitalize bg-emerald-500/20 px-4 py-1.5 rounded-full font-bold border border-emerald-500/30">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl border border-indigo-500/30">
                  <FiCalendar className="text-indigo-400 text-xl" />
                </div>
                <h3 className="font-bold text-white text-xl">Availability</h3>
              </div>
              <div className="glass rounded-2xl p-6 space-y-4 border border-white/5">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-400 text-sm font-medium">Start Date</span>
                  <span className="text-gray-100 font-bold text-base">
                    {profile.availability.startDate ? formatDateRange(profile.availability.startDate, null, false) : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Duration</span>
                  <span className="text-gray-100 font-bold text-base">{profile.availability.duration || "Not set"}</span>
                </div>
              </div>
            </div>

            {/* Expected Salary */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl border border-yellow-500/30">
                  <FiDollarSign className="text-yellow-400 text-xl" />
                </div>
                <h3 className="font-bold text-white text-xl">Expected Salary</h3>
              </div>
              <div className="glass rounded-2xl p-6 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30">
                <p className="text-yellow-200 font-bold text-xl">
                  {profile.expectedSalary.amount > 0
                    ? `${profile.expectedSalary.currency} ${profile.expectedSalary.amount.toLocaleString()} per ${profile.expectedSalary.period}`
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

