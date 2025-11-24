"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { FiArrowLeft, FiClock, FiTrendingUp, FiVideo } from "react-icons/fi";
import { formatDateRange } from "@/lib/utils";

export default function InterviewReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="glass-dark rounded-3xl shadow-2xl p-6 mb-8 border border-white/10">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold gradient-text mb-2">Interview Reports</h1>
          <p className="text-gray-400 text-sm">Review your interview performance and track your progress</p>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-dark rounded-3xl shadow-2xl p-12 text-center border border-white/10">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">No Interview Reports Yet</h2>
            <p className="text-gray-400 mb-6">Complete an interview to see your performance report</p>
            <button
              onClick={() => router.push("/interview")}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-500 hover:to-primary-400 transition-all"
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const report = session.report;
              const overallScore = report?.overallPerformance?.score || 0;
              
              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/interview/report/${session.id}`)}
                  className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10 hover:border-primary-500/30 transition-all duration-300 cursor-pointer card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`px-4 py-2 rounded-xl border ${
                          overallScore >= 80 ? "bg-green-500/20 border-green-500/30" :
                          overallScore >= 60 ? "bg-yellow-500/20 border-yellow-500/30" :
                          "bg-red-500/20 border-red-500/30"
                        }`}>
                          <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                            {overallScore}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Interview Session
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
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4" />
                          <span>{formatDuration(session.duration_seconds)}</span>
                        </div>
                        {session.video_url && (
                          <div className="flex items-center gap-2">
                            <FiVideo className="w-4 h-4" />
                            <span>Video Available</span>
                          </div>
                        )}
                        {report && (
                          <div className="flex items-center gap-2">
                            <FiTrendingUp className="w-4 h-4" />
                            <span>Report Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

