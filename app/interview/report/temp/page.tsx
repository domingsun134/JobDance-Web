"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiUser, FiBriefcase, FiTarget, FiAlertTriangle } from "react-icons/fi";

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

export default function TempInterviewReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempData, setTempData] = useState<any>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        // Try to load report from sessionStorage
        const stored = sessionStorage.getItem('temp_interview_report');
        if (stored) {
          const data = JSON.parse(stored);
          setTempData(data);
          if (data.report) {
            setReport(data.report);
          }
        } else {
          // No temp report found, redirect to dashboard
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error('Error loading temp report:', error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [router]);

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

  if (!report) {
    return (
      <div className="min-h-screen px-4 py-8 pb-24 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="glass-dark rounded-3xl shadow-2xl p-8 border border-white/10 text-center">
            <FiAlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Report Not Found</h2>
            <p className="text-gray-400 mb-6">Unable to load the interview report.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
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
        {/* Warning Banner */}
        <div className="glass-dark rounded-3xl shadow-2xl p-6 mb-8 border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-4">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-300 mb-2">Temporary Report</h3>
              <p className="text-yellow-200/80 text-sm">
                This report was generated successfully, but the session could not be saved to the database. 
                This is a temporary view that will be cleared when you close your browser. 
                Please note that this report may not be accessible later.
              </p>
            </div>
          </div>
        </div>

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
                {tempData?.timestamp && new Date(tempData.timestamp).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {tempData?.duration && ` • ${formatDuration(tempData.duration)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${getScoreBgColor(report.overallPerformance.score)}`}>
              <FiTrendingUp className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Overall Performance</h2>
              <p className="text-gray-400 text-sm">Your interview performance summary</p>
            </div>
            <div className="ml-auto">
              <div className={`text-5xl font-bold ${getScoreColor(report.overallPerformance.score)}`}>
                {report.overallPerformance.score}
              </div>
              <div className="text-gray-400 text-sm text-center">/ 100</div>
            </div>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">{report.overallPerformance.summary}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
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
          </div>
        </div>

        {/* Technical Knowledge */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${getScoreBgColor(report.technicalKnowledge.score)}`}>
              <FiBriefcase className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Technical Knowledge</h2>
              <p className="text-gray-400 text-sm">Assessment of your technical expertise</p>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(report.technicalKnowledge.score)}`}>
              {report.technicalKnowledge.score}
            </div>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">{report.technicalKnowledge.assessment}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Areas of Expertise</h3>
              <ul className="space-y-2">
                {report.technicalKnowledge.areasOfExpertise.map((area, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Knowledge Gaps</h3>
              <ul className="space-y-2">
                {report.technicalKnowledge.gaps.map((gap, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${getScoreBgColor(report.confidenceLevel.score)}`}>
              <FiUser className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Confidence Level</h2>
              <p className="text-gray-400 text-sm">How confidently you presented yourself</p>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(report.confidenceLevel.score)}`}>
              {report.confidenceLevel.score}
            </div>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">{report.confidenceLevel.assessment}</p>
          
          <div>
            <h3 className="text-lg font-semibold text-primary-400 mb-3">Confidence Indicators</h3>
            <ul className="space-y-2">
              {report.confidenceLevel.indicators.map((indicator, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-2">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Job Suitability */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${getScoreBgColor(report.jobSuitability.score)}`}>
              <FiTarget className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Job Suitability</h2>
              <p className="text-gray-400 text-sm">How well you match the role requirements</p>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(report.jobSuitability.score)}`}>
              {report.jobSuitability.score}
            </div>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">{report.jobSuitability.assessment}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Alignment</h3>
              <ul className="space-y-2">
                {report.jobSuitability.alignment.map((item, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Concerns</h3>
              <ul className="space-y-2">
                {report.jobSuitability.concerns.map((concern, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Hiring Likelihood */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${getScoreBgColor(report.hiringLikelihood.score)}`}>
              <FiCheckCircle className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Hiring Likelihood</h2>
              <p className="text-gray-400 text-sm">Probability of receiving an offer</p>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(report.hiringLikelihood.score)}`}>
              {report.hiringLikelihood.score}
            </div>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">{report.hiringLikelihood.assessment}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary-400 mb-3">Key Factors</h3>
            <ul className="space-y-2">
              {report.hiringLikelihood.factors.map((factor, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-2">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-primary-400 mb-2">Recommendation</h3>
            <p className="text-gray-300 leading-relaxed">{report.hiringLikelihood.recommendation}</p>
          </div>
        </div>

        {/* Conversation Analysis */}
        {report.conversationAnalysis && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Conversation Analysis</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {report.conversationAnalysis.coherence && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-2">Coherence</h3>
                  <p className="text-gray-300">{report.conversationAnalysis.coherence}</p>
                </div>
              )}
              {report.conversationAnalysis.consistency && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-2">Consistency</h3>
                  <p className="text-gray-300">{report.conversationAnalysis.consistency}</p>
                </div>
              )}
              {report.conversationAnalysis.depth && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-2">Depth</h3>
                  <p className="text-gray-300">{report.conversationAnalysis.depth}</p>
                </div>
              )}
              {report.conversationAnalysis.narrative && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-2">Narrative</h3>
                  <p className="text-gray-300">{report.conversationAnalysis.narrative}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Improvements */}
        {report.improvements && report.improvements.length > 0 && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Recommended Improvements</h2>
            <div className="space-y-4">
              {report.improvements.map((improvement, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-primary-400">{improvement.category}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      improvement.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      improvement.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {improvement.priority} Priority
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{improvement.suggestion}</p>
                  {improvement.evidence && (
                    <p className="text-gray-400 text-sm italic">Evidence: {improvement.evidence}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Considerations */}
        {report.considerations && report.considerations.length > 0 && (
          <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Additional Considerations</h2>
            <ul className="space-y-3">
              {report.considerations.map((consideration, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-3">
                  <span className="text-primary-400 mt-1">•</span>
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

