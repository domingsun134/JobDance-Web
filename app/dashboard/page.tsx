"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
  getUserProfile,
  logoutUser,
  type User,
  type UserProfile,
} from "@/lib/auth";
import {
  FiLogOut,
  FiBriefcase,
  FiBook,
  FiCode,
  FiGlobe,
  FiCalendar,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiMessageCircle,
  FiActivity,
} from "react-icons/fi";
import { formatDateRange } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

const glassPanel =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(6,182,212,0.15)]";

const statCard =
  "rounded-2xl border border-white/10 bg-black/30 px-4 py-5 transition hover:border-cyan-400/40";

const sectionLabel =
  "text-[11px] uppercase tracking-[0.35em] text-white/60 font-semibold";

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
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  const stats = [
    {
      label: "Experience entries",
      value: profile.workExperience.length,
      helper: "Career depth",
    },
    {
      label: "Skills highlighted",
      value: profile.skills.length,
      helper: "Areas of mastery",
    },
    {
      label: "Education records",
      value: profile.education.length,
      helper: "Learning paths",
    },
    {
      label: "Languages spoken",
      value: profile.languages.length,
      helper: "Communication range",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black pb-28 text-white">
      {/* Backgrounds */}
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "140px 140px",
          }}
        />
        <div className="absolute -top-32 -left-10 h-96 w-96 rounded-full bg-purple-500/30 blur-[140px]" />
        <div className="absolute bottom-0 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[200px]" />
      </div>

      <Sidebar />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 md:px-10 md:pl-72">
        {/* Hero */}
        <section className={`${glassPanel} p-6`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={sectionLabel}>Career cockpit</p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">
                <span className="text-white">Welcome back, </span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  {profile.personalInfo.fullName || "Creator"}
                </span>
              </h1>
              <p className="mt-3 text-sm text-white/70">
                Continue your AI-powered journey — everything is synced with the
                landing experience.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70">
                {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-cyan-400/60 hover:text-white"
              >
                <FiLogOut className="text-base" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className={statCard}>
                <p className="text-4xl font-semibold text-white">
                  {stat.value.toString().padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm font-medium text-white/80">
                  {stat.label}
                </p>
                <p className="text-xs text-white/50">{stat.helper}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className={`${glassPanel} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={sectionLabel}>Quick actions</p>
              <h2 className="mt-1 text-xl font-semibold">Launch your next move</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
              Synced with AI copilots
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              href="/interview"
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/70 via-indigo-600/80 to-cyan-500/70 px-5 py-6 shadow-[0_20px_60px_rgba(79,70,229,0.35)] transition hover:scale-[1.01]"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-widest">
                Live AI
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold">Start Interview</h3>
              <p className="mt-1 text-sm text-white/80">
                Adaptive interviews with instant coaching.
              </p>
              <FiMessageCircle className="absolute bottom-4 right-4 text-3xl text-white/60 transition group-hover:text-white" />
            </Link>

            <Link
              href="/interview/reports"
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-6 transition hover:border-cyan-400/50"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
                Insights
              </div>
              <h3 className="text-lg font-semibold text-white">Reports & Coaching</h3>
              <p className="mt-1 text-sm text-white/70">
                Break down past sessions and unlock next steps.
              </p>
              <FiActivity className="absolute bottom-4 right-4 text-3xl text-white/50 transition group-hover:text-cyan-300" />
            </Link>

            <Link
              href="/resume-builder"
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/40 via-sky-600/50 to-emerald-500/40 px-5 py-6 shadow-[0_20px_60px_rgba(6,182,212,0.25)] transition hover:scale-[1.01]"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-widest">
                New
              </div>
              <h3 className="text-lg font-semibold">Resume Builder</h3>
              <p className="mt-1 text-sm text-white/80">
                Generate on-brand resumes in seconds.
              </p>
              <FiFileText className="absolute bottom-4 right-4 text-3xl text-white/70 transition group-hover:text-white" />
            </Link>
          </div>
        </section>

        {/* Profile Summary */}
        <section className={`${glassPanel} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={sectionLabel}>Profile intelligence</p>
              <h2 className="mt-1 text-xl font-semibold">Your career fingerprint</h2>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-pink-400/50 hover:text-white"
            >
              <FiEdit3 className="text-base" />
              Refine profile
            </Link>
          </div>

          <div className="mt-6 space-y-6">
            {/* Work Experience */}
            {profile.workExperience.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <FiBriefcase className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Work Experience
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.workExperience.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-purple-400/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {exp.position}
                          </p>
                          <p className="text-sm text-white/60">{exp.company}</p>
                        </div>
                        {exp.current && (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-white/50">
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </p>
                      {exp.description && (
                        <p className="mt-3 text-sm text-white/70">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <FiBook className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Education
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <p className="text-lg font-semibold text-white">
                        {edu.degree} · {edu.field}
                      </p>
                      <p className="text-sm text-white/60">{edu.institution}</p>
                      <p className="mt-2 text-xs text-white/50">
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
                <div className="flex items-center gap-2 text-white/70">
                  <FiCode className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/15 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80"
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
                <div className="flex items-center gap-2 text-white/70">
                  <FiGlobe className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Languages
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.languages.map((lang, index) => (
                    <div
                      key={`${lang.name}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-white">
                        {lang.name}
                      </span>
                      <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability & Salary */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <FiCalendar className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Availability
                  </h3>
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Start date</span>
                    <span className="font-semibold text-white">
                      {profile.availability.startDate
                        ? formatDateRange(
                            profile.availability.startDate,
                            null,
                            false,
                          )
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Duration</span>
                    <span className="font-semibold text-white">
                      {profile.availability.duration || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-purple-500/10 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <FiDollarSign className="text-base" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Expected salary
                  </h3>
                </div>
                <p className="mt-6 text-2xl font-semibold">
                  {profile.expectedSalary.amount > 0
                    ? `${profile.expectedSalary.currency} ${profile.expectedSalary.amount.toLocaleString()}/${profile.expectedSalary.period}`
                    : "Not set"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/50">
                  Updated in real time
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

