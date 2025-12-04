"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { FiArrowLeft, FiClock, FiTrendingUp, FiVideo, FiMenu, FiLoader, FiAlertCircle } from "react-icons/fi";
import { formatDateRange } from "@/lib/utils";

const glassPanel = "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.45)]";

export default function InterviewReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        // Fetch all interview sessions
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setSessions(data || []);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [router]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950" />
          <div className="absolute -top-32 -left-10 h-96 w-96 rounded-full bg-purple-500/30 blur-[140px]" />
          <div className="absolute bottom-0 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[200px]" />
        </div>
        <div className="relative z-10 h-16 w-16 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background Elements */}
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div className="relative z-10 flex min-h-screen flex-col md:pl-72">
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-10 md:pb-10">

          {/* Mobile Header */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-white/70">
              <FiMenu size={20} />
            </button>
            <h1 className="text-base font-semibold text-white">Reports</h1>
            <div className="w-5" />
          </div>

          {/* Desktop Header */}
          <div className={`${glassPanel} p-8 mb-8 hidden md:block`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Interview Reports</h1>
                <p className="text-gray-400">Track your progress and review your performance analysis</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <FiTrendingUp className="text-cyan-400 text-xl" />
              </div>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className={`${glassPanel} p-12 text-center`}>
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <FiClock className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No Interview Reports Yet</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Complete an interview session to receive a detailed AI analysis of your performance.</p>
              <button
                onClick={() => router.push("/interview")}
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
              >
                Start New Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const report = session.report;
                const isGenerating = !report || Object.keys(report).length === 0;
                const overallScore = report?.overallPerformance?.score || 0;

                return (
                  <div
                    key={session.id}
                    onClick={() => !isGenerating && router.push(`/interview/report/${session.id}`)}
                    className={`${glassPanel} p-6 transition-all duration-300 group ${isGenerating
                        ? "opacity-80 cursor-wait"
                        : "hover:border-cyan-500/30 hover:bg-white/10 cursor-pointer hover:-translate-y-0.5"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          {isGenerating ? (
                            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                              <FiLoader className="w-6 h-6 text-cyan-400 animate-spin" />
                            </div>
                          ) : (
                            <div className={`px-4 py-2 rounded-xl border backdrop-blur-md ${overallScore >= 80 ? "bg-green-500/10 border-green-500/20" :
                                overallScore >= 60 ? "bg-yellow-500/10 border-yellow-500/20" :
                                  "bg-red-500/10 border-red-500/20"
                              }`}>
                              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                                {overallScore}
                              </div>
                            </div>
                          )}

                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              Interview Session
                              {isGenerating && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                                  Generating Report...
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {new Date(session.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-gray-500" />
                            <span>{formatDuration(session.duration_seconds)}</span>
                          </div>
                          {session.video_url && (
                            <div className="flex items-center gap-2">
                              <FiVideo className="w-4 h-4 text-gray-500" />
                              <span>Video Recorded</span>
                            </div>
                          )}
                          {!isGenerating && (
                            <div className="flex items-center gap-2 text-cyan-400/80">
                              <FiTrendingUp className="w-4 h-4" />
                              <span>Analysis Ready</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isGenerating && (
                        <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

