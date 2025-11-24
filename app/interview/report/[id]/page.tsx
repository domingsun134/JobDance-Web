"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiUser, FiBriefcase, FiTarget } from "react-icons/fi";

interface InterviewReport {
  overallPerformance: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  technicalKnowledge: {
    score: number;
    assessment: string;
    areasOfExpertise: string[];
    gaps: string[];
  };
  confidenceLevel: {
    score: number;
    assessment: string;
    indicators: string[];
  };
  jobSuitability: {
    score: number;
    assessment: string;
    alignment: string[];
    concerns: string[];
  };
  hiringLikelihood: {
    score: number;
    assessment: string;
    factors: string[];
    recommendation: string;
  };
  conversationAnalysis?: {
    coherence?: string;
    consistency?: string;
    depth?: string;
    narrative?: string;
  };
  improvements: Array<{
    category: string;
    suggestion: string;
    priority: string;
    evidence?: string;
  }>;
  considerations: string[];
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        // Fetch interview session
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', currentUser.id)
          .single();

        if (error || !data) {
          throw new Error('Report not found');
        }

        setSession(data);
        if (data.report) {
          setReport(data.report);
        }
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [params.id, router]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!report || !session) {
    return (
      <div className="min-h-screen px-4 py-8 pb-24 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="glass-dark rounded-3xl shadow-2xl p-8 text-center">
            <FiAlertCircle className="text-6xl text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Report Not Found</h1>
            <p className="text-gray-400 mb-6">The interview report you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-500 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <FiArrowLeft />
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-4xl font-bold gradient-text mb-2">Interview Report</h1>
              <p className="text-gray-400 text-sm">
                {new Date(session.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {session.duration_seconds && ` • ${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl border border-primary-500/30">
              <FiTrendingUp className="text-3xl text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Overall Performance</h2>
              <p className="text-gray-400 text-sm">Your interview performance summary</p>
            </div>
            <div className={`ml-auto px-6 py-3 rounded-2xl border ${getScoreBgColor(report.overallPerformance.score)}`}>
              <div className={`text-4xl font-bold ${getScoreColor(report.overallPerformance.score)}`}>
                {report.overallPerformance.score}
              </div>
              <div className="text-xs text-gray-400 text-center mt-1">Score</div>
            </div>
          </div>
          <p className="text-gray-300 text-base leading-relaxed mb-6">{report.overallPerformance.summary}</p>
          
          {report.overallPerformance.strengths.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <FiCheckCircle />
                Strengths
              </h3>
              <ul className="space-y-2">
                {report.overallPerformance.strengths.map((strength, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.overallPerformance.weaknesses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <FiAlertCircle />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {report.overallPerformance.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detailed Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Technical Knowledge */}
          <div className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                  <FiBriefcase className="text-xl text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Technical Knowledge</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(report.technicalKnowledge.score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(report.technicalKnowledge.score)}`}>
                  {report.technicalKnowledge.score}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">{report.technicalKnowledge.assessment}</p>
            {report.technicalKnowledge.areasOfExpertise.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Areas of Expertise:</p>
                <div className="flex flex-wrap gap-2">
                  {report.technicalKnowledge.areasOfExpertise.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs border border-blue-500/30">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confidence Level */}
          <div className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <FiUser className="text-xl text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Confidence Level</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(report.confidenceLevel.score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(report.confidenceLevel.score)}`}>
                  {report.confidenceLevel.score}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">{report.confidenceLevel.assessment}</p>
            {report.confidenceLevel.indicators.length > 0 && (
              <ul className="space-y-1">
                {report.confidenceLevel.indicators.map((indicator, idx) => (
                  <li key={idx} className="text-gray-400 text-xs flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Job Suitability */}
          <div className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
                  <FiTarget className="text-xl text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Job Suitability</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(report.jobSuitability.score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(report.jobSuitability.score)}`}>
                  {report.jobSuitability.score}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">{report.jobSuitability.assessment}</p>
            {report.jobSuitability.alignment.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Alignment Factors:</p>
                <ul className="space-y-1">
                  {report.jobSuitability.alignment.map((factor, idx) => (
                    <li key={idx} className="text-gray-400 text-xs flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hiring Likelihood */}
          <div className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                  <FiTrendingUp className="text-xl text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Hiring Likelihood</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(report.hiringLikelihood.score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(report.hiringLikelihood.score)}`}>
                  {report.hiringLikelihood.score}%
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">{report.hiringLikelihood.assessment}</p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-300 text-sm font-semibold mb-2">Recommendation:</p>
              <p className="text-gray-300 text-sm">{report.hiringLikelihood.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Conversation Analysis */}
        {report.conversationAnalysis && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Conversation Analysis
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {report.conversationAnalysis.coherence && (
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">Coherence</h3>
                  <p className="text-gray-300 text-sm">{report.conversationAnalysis.coherence}</p>
                </div>
              )}
              {report.conversationAnalysis.consistency && (
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">Consistency</h3>
                  <p className="text-gray-300 text-sm">{report.conversationAnalysis.consistency}</p>
                </div>
              )}
              {report.conversationAnalysis.depth && (
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">Depth</h3>
                  <p className="text-gray-300 text-sm">{report.conversationAnalysis.depth}</p>
                </div>
              )}
              {report.conversationAnalysis.narrative && (
                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">Overall Narrative</h3>
                  <p className="text-gray-300 text-sm">{report.conversationAnalysis.narrative}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Improvements */}
        {report.improvements.length > 0 && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FiTrendingUp className="text-primary-400" />
              Improvement Suggestions
            </h2>
            <div className="space-y-4">
              {report.improvements.map((improvement, idx) => (
                <div key={idx} className="glass rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-xs font-semibold border border-primary-500/30">
                      {improvement.category}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      improvement.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      improvement.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {improvement.priority} Priority
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-3">{improvement.suggestion}</p>
                  {improvement.evidence && (
                    <p className="text-gray-400 text-xs mt-2 italic">Based on: {improvement.evidence}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Considerations */}
        {report.considerations.length > 0 && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FiAlertCircle className="text-yellow-400" />
              Important Considerations
            </h2>
            <ul className="space-y-3">
              {report.considerations.map((consideration, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

