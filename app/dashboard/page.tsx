"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getUserProfile, logoutUser, type User, type UserProfile } from "@/lib/auth";
import { FiLogOut, FiBriefcase, FiBook, FiCode, FiGlobe, FiCalendar, FiDollarSign, FiEdit3 } from "react-icons/fi";
import { formatDateRange } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

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
    <div className="h-screen flex flex-col px-3 py-2 pb-20 bg-background relative overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <Sidebar />

      <div className="max-w-5xl mx-auto w-full h-full flex flex-col relative z-10 overflow-hidden md:pl-64 transition-all duration-300">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm p-4 mb-4 border flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-full border border-border/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-muted-foreground text-xs font-medium truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-200"
            >
              <FiLogOut className="text-sm" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl shadow-sm p-4 mb-4 border flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="flex gap-3">
            <Link
              href="/interview"
              className="group relative flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg text-center font-medium hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.99] overflow-hidden"
            >
              <span className="relative flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start Interview
              </span>
            </Link>
            <Link
              href="/interview/reports"
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-center font-medium hover:bg-secondary/80 transition-all duration-300 border border-border"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">Reports</span>
            </Link>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-card rounded-xl shadow-sm p-4 border flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Your Profile</h2>
            </div>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <FiEdit3 className="text-sm" />
              <span>Edit</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
            {/* Work Experience */}
            {profile.workExperience.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiBriefcase className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Work Experience</h3>
                </div>
                <div className="space-y-2">
                  {profile.workExperience.map((exp) => (
                    <div key={exp.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{exp.position}</p>
                          <p className="text-muted-foreground text-xs truncate">{exp.company}</p>
                        </div>
                        {exp.current && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-medium rounded-full ml-2 flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiBook className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Education</h3>
                </div>
                <div className="space-y-2">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{edu.degree} in {edu.field}</p>
                          <p className="text-muted-foreground text-xs truncate">{edu.institution}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiCode className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiGlobe className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Languages</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className="px-3 py-2 rounded-lg border bg-muted/30 flex justify-between items-center">
                      <span className="text-foreground text-xs font-medium">{lang.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize bg-background px-2 py-0.5 rounded-full border">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability & Salary Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Availability */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Availability</h3>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Start</span>
                    <span className="text-foreground font-medium text-xs">
                      {profile.availability.startDate ? formatDateRange(profile.availability.startDate, null, false) : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Duration</span>
                    <span className="text-foreground font-medium text-xs">{profile.availability.duration || "Not set"}</span>
                  </div>
                </div>
              </div>

              {/* Expected Salary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-muted-foreground text-sm" />
                  <h3 className="font-medium text-foreground text-sm">Salary</h3>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 h-[88px] flex items-center justify-center">
                  <p className="text-foreground font-medium text-sm text-center">
                    {profile.expectedSalary.amount > 0
                      ? `${profile.expectedSalary.currency} ${profile.expectedSalary.amount.toLocaleString()}/${profile.expectedSalary.period}`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

