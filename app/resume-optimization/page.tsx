'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ResumePreview, { TemplateType } from '@/components/ResumePreview';
import {
    getUserProfile,
    UserProfile,
    getCurrentUser,
    getOptimizedResumes,
    saveOptimizedResume,
    deleteOptimizedResume,
    ResumeOptimization
} from '@/lib/auth';
import { FiCpu, FiPlus, FiTrash2, FiEye, FiCheck, FiDownload, FiArrowLeft, FiInfo, FiFileText, FiAlignLeft } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';

// Using consistent dashboard colors and glassmorphism
const glassPanel = "rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-xl";
const inputStyle = "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all duration-300";

export default function ResumeOptimizationPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [optimizations, setOptimizations] = useState<ResumeOptimization[]>([]);

    // Form State
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Create a ref for the resume component
    const resumePreviewRef = useRef<HTMLDivElement>(null);

    // View State
    const [selectedOptimization, setSelectedOptimization] = useState<ResumeOptimization | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
    const [previewTab, setPreviewTab] = useState<'resume' | 'coverLetter'>('resume');
    const [mobileViewTab, setMobileViewTab] = useState<'preview' | 'summary'>('preview');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUserId(user.id);

            const userProfile = await getUserProfile();
            setProfile(userProfile);

            const savedOptimizations = await getOptimizedResumes(user.id);
            setOptimizations(savedOptimizations);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        if (!profile || !jobTitle || !jobDescription || !userId) return;

        if (optimizations.length >= 5) {
            alert("You have reached the maximum limit of 5 optimized resumes. Please delete one to create a new one.");
            return;
        }

        setIsOptimizing(true);
        try {
            const res = await fetch("/api/resume/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentProfile: profile,
                    jobTitle,
                    jobDescription
                })
            });

            const data = await res.json();

            if (res.ok && data.optimizedProfile) {
                // Save to DB
                // Ensure we handle both direct profile return (legacy) and new structure
                const optimizedProfile = data.optimizedProfile;
                const optimizationSummary = data.optimizationSummary || "AI optimization complete based on provided job description.";

                // Extract cover letter to save separately
                const optimizedCoverLetter = optimizedProfile.coverLetter;

                const newOptimization = await saveOptimizedResume(userId, {
                    job_title: jobTitle,
                    job_description: jobDescription,
                    optimized_profile_data: optimizedProfile,
                    optimized_cover_letter: optimizedCoverLetter,
                    optimization_summary: optimizationSummary
                });

                if (newOptimization) {
                    setOptimizations([newOptimization, ...optimizations]);
                    setSelectedOptimization(newOptimization);
                    setViewMode('view');
                    // Reset form
                    setJobTitle('');
                    setJobDescription('');
                }
            } else {
                console.error("Optimization failed:", data.error);
                alert("Failed to optimize resume: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error optimizing resume:", error);
            alert("An error occurred while optimizing your resume.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this optimization?")) return;

        try {
            await deleteOptimizedResume(id);
            setOptimizations(optimizations.filter(opt => opt.id !== id));
            if (selectedOptimization?.id === id) {
                setSelectedOptimization(null);
                setViewMode('list');
            }
        } catch (error) {
            console.error("Error deleting optimization:", error);
            alert("Failed to delete optimization.");
        }
    };

    const printPDF = useReactToPrint({
        contentRef: resumePreviewRef,
        documentTitle: `Optimized-Resume-${selectedOptimization?.job_title || 'Draft'}`,
        bodyClass: "print-preview",
        pageStyle: `
            @page {
                size: auto;
                margin: 15mm 0mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
                #resume-preview {
                    box-shadow: none !important;
                }
            }
        `,
        onBeforePrint: () => {
            setIsExporting(true);
            return Promise.resolve();
        },
        onAfterPrint: () => {
            setIsExporting(false);
        },
        onPrintError: (errorLocation, error) => {
            setIsExporting(false);
            console.error("Print Error:", errorLocation, error);
            alert("Failed to export PDF. Please try again.");
        },
    });

    const handleExportPDF = () => {
        if (!resumePreviewRef.current) {
            console.error("Print Error: Resume ref is null");
            alert("Error: content to print not found. Please refresh and try again.");
            return;
        }
        printPDF();
    };


    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-white/40 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-white font-sans">
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

            <Sidebar />

            {/* Main Content Area - Fixed Layout */}
            <main className="flex-1 flex flex-col h-screen relative overflow-hidden md:pl-64 z-10">

                <div className="flex-1 flex flex-col min-h-0 relative z-10">
                    {/* Header - Fixed Height */}
                    <header className="flex-none p-6 md:px-8 md:py-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-sm z-20">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                                Resume Optimization
                            </h1>
                            <p className="text-sm text-gray-400">
                                {viewMode === 'list' && "Manage your ATS-optimized resumes"}
                                {viewMode === 'create' && "Create a new optimized resume"}
                                {viewMode === 'view' && selectedOptimization?.job_title}
                            </p>
                        </div>
                        {viewMode !== 'list' && (
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                <FiArrowLeft /> Back to List
                            </button>
                        )}
                    </header>

                    {/* Content Body - Scrollable Container */}
                    <div className="flex-1 overflow-hidden p-6 md:px-8">

                        {/* LIST MODE */}
                        {viewMode === 'list' && (
                            <div className="h-full overflow-y-auto pr-2 pb-20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Create New Card */}
                                    <button
                                        onClick={() => {
                                            if (optimizations.length >= 5) {
                                                alert("You have reached the limit of 5 optimizations.");
                                            } else {
                                                setViewMode('create');
                                            }
                                        }}
                                        className={`${glassPanel} p-6 flex flex-col items-center justify-center gap-4 aspect-[4/3] hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all hover:scale-[1.02] cursor-pointer group border-dashed border-2 border-white/10`}
                                    >
                                        <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                                            <FiPlus size={28} />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white mb-1">New Optimization</h3>
                                            <p className="text-gray-500 text-xs">Analyze Job Description</p>
                                        </div>
                                    </button>

                                    {/* Existing Optimizations */}
                                    {optimizations.map((opt) => (
                                        <div key={opt.id} className={`${glassPanel} p-5 flex flex-col gap-4 hover:border-white/20 transition-all group aspect-[4/3] relative`}>
                                            <div className="flex justify-between items-start">
                                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-300">
                                                    <FiFileText size={20} />
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(opt.id, e)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex-1 min-h-0">
                                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={opt.job_title}>{opt.job_title}</h3>
                                                <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">{opt.job_description}</p>
                                            </div>

                                            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                                <span>{new Date(opt.created_at).toLocaleDateString()}</span>
                                                <button
                                                    onClick={() => {
                                                        setSelectedOptimization(opt);
                                                        setViewMode('view');
                                                    }}
                                                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                                                >
                                                    <FiEye size={14} /> View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CREATE MODE - Split View */}
                        {viewMode === 'create' && (
                            <div className="h-full flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
                                <div className={`${glassPanel} p-6 lg:p-8 flex flex-col gap-6 flex-1 lg:max-w-xl h-full overflow-y-auto`}>
                                    <div className="flex items-center gap-3 text-white mb-2">
                                        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                                            <FiCpu className="text-lg" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">Target Job Details</h2>
                                            <p className="text-sm text-gray-400">Paste the job description to tailor your resume.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-5 flex-1">
                                        <div>
                                            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 ml-1 mb-2 block">Job Title</label>
                                            <input
                                                value={jobTitle}
                                                onChange={(e) => setJobTitle(e.target.value)}
                                                placeholder="e.g. Senior Frontend Engineer"
                                                className={inputStyle}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col min-h-[200px]">
                                            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 ml-1 mb-2 block">Job Description</label>
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the full job description here..."
                                                className={`${inputStyle} flex-1 resize-none font-mono text-sm leading-relaxed`}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleOptimize}
                                        disabled={isOptimizing || !jobTitle || !jobDescription}
                                        className={`
                                            w-full py-4 rounded-xl font-bold text-md shadow-lg 
                                            flex items-center justify-center gap-3 transition-all duration-300
                                            ${isOptimizing || !jobTitle || !jobDescription
                                                ? "bg-slate-700 text-gray-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20 hover:shadow-cyan-900/40 hover:-translate-y-0.5"
                                            }
                                        `}
                                    >
                                        {isOptimizing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>Analyzing & Optimizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiCpu className="text-lg" />
                                                <span>Generate Optimized Resume</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Instruction / Tips Panel */}
                                <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-12 text-gray-500 gap-6 opacity-60">
                                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                        <FiCpu size={40} className="text-gray-600" />
                                    </div>
                                    <div className="max-w-sm">
                                        <h3 className="text-xl font-medium text-gray-300 mb-3">Ready to Optimize</h3>
                                        <p className="leading-relaxed">Our AI will analyze your profile against the job description to highlight relevant skills, adjust your summary, and emphasize impactful experience.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW MODE - Split View (Resume + Summary) */}
                        {viewMode === 'view' && selectedOptimization && (
                            <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
                                {/* Mobile Tab Switcher - Only visible on mobile */}
                                <div className="lg:hidden flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/5 mb-2">
                                    <button
                                        onClick={() => setMobileViewTab('preview')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${mobileViewTab === 'preview'
                                            ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <FiFileText size={16} />
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setMobileViewTab('summary')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${mobileViewTab === 'summary'
                                            ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <FiInfo size={16} />
                                        Summary
                                    </button>
                                </div>

                                {/* Left Column: Resume Preview */}
                                <div className={`${mobileViewTab === 'preview' ? 'flex' : 'hidden'} lg:flex flex-1 lg:flex-[3] flex-col gap-4 min-h-0`}>
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/5">
                                            <button
                                                onClick={() => setPreviewTab('resume')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${previewTab === 'resume'
                                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <FiFileText size={14} />
                                                Resume
                                            </button>
                                            <button
                                                onClick={() => setPreviewTab('coverLetter')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${previewTab === 'coverLetter'
                                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <FiAlignLeft size={14} />
                                                Cover Letter
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleExportPDF}
                                            disabled={isExporting}
                                            className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium transition-all flex items-center gap-2 border border-cyan-500/20"
                                        >
                                            {isExporting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <FiDownload />}
                                            <span className="hidden sm:inline">Export PDF</span>
                                            <span className="sm:hidden">PDF</span>
                                        </button>
                                    </div>

                                    {/* Scrollable Document Container */}
                                    <div className="flex-1 bg-slate-900/50 rounded-2xl overflow-y-auto border border-white/5 relative shadow-inner p-2 sm:p-4 md:p-6 custom-scrollbar">
                                        <div ref={resumePreviewRef} id="resume-preview" className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] origin-top transform-gpu scale-[0.75] sm:scale-[0.85] md:scale-100">
                                            {previewTab === 'resume' ? (
                                                <ResumePreview profile={selectedOptimization.optimized_profile_data} template="modern" />
                                            ) : (
                                                <div className="p-6 sm:p-10 md:p-12 lg:p-16 text-gray-800 font-serif h-full min-h-[297mm] flex flex-col">
                                                    {/* Cover Letter Header */}
                                                    <div className="mb-8 sm:mb-10 md:mb-12 border-b-2 border-gray-900 pb-4 sm:pb-5 md:pb-6 print:mb-8">
                                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3 sm:mb-4 text-gray-900">
                                                            {selectedOptimization.optimized_profile_data.personalInfo.fullName}
                                                        </h1>
                                                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600 font-medium font-sans">
                                                            {selectedOptimization.optimized_profile_data.personalInfo.email && (
                                                                <span>{selectedOptimization.optimized_profile_data.personalInfo.email}</span>
                                                            )}
                                                            {selectedOptimization.optimized_profile_data.personalInfo.phone && (
                                                                <span>| {selectedOptimization.optimized_profile_data.personalInfo.phone}</span>
                                                            )}
                                                            {selectedOptimization.optimized_profile_data.personalInfo.location && (
                                                                <span>| {selectedOptimization.optimized_profile_data.personalInfo.location}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Cover Letter Body */}
                                                    <div className="flex-1 whitespace-pre-wrap leading-relaxed text-sm sm:text-base md:text-lg max-w-[65ch]">
                                                        {selectedOptimization.optimized_cover_letter ||
                                                            selectedOptimization.optimized_profile_data.coverLetter ||
                                                            "No cover letter generated for this optimization."}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Optimization Summary */}
                                <div className={`${mobileViewTab === 'summary' ? 'flex' : 'hidden'} lg:flex flex-none lg:w-80 xl:w-96 flex-col gap-4 min-h-0 print:hidden`}>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1 hidden lg:block">Optimization Insights</h3>

                                    <div className={`${glassPanel} flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4`}>
                                        <div className="flex items-start gap-3 md:gap-4 pb-4 border-b border-white/5">
                                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                                                <FiInfo size={18} className="md:w-5 md:h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm md:text-base">AI Analysis</h4>
                                                <p className="text-xs text-gray-500 mt-1">Why this was optimized</p>
                                            </div>
                                        </div>

                                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed">
                                            {(() => {
                                                const text = selectedOptimization.optimization_summary || "No summary available for this optimization.";
                                                // Check if the text looks like a list (contains bullets or numbers at start of lines)
                                                const hasListItems = /^\s*[-•*]|\d+\./m.test(text);

                                                if (hasListItems) {
                                                    return (
                                                        <div className="space-y-2">
                                                            {text.split('\n').map((line, i) => {
                                                                const trimmed = line.trim();
                                                                if (!trimmed) return <br key={i} />;

                                                                // Check for list item markers
                                                                const isListItem = /^[-•*]|\d+\./.test(trimmed);

                                                                if (isListItem) {
                                                                    return (
                                                                        <div key={i} className="flex gap-2 pl-2">
                                                                            <span className="text-cyan-400 mt-1 flex-shrink-0">•</span>
                                                                            <span>{trimmed.replace(/^[-•*]|\d+\.\s*/, '').trim()}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return <p key={i}>{line}</p>;
                                                            })}
                                                        </div>
                                                    );
                                                }

                                                // Fallback for plain text
                                                return <p className="whitespace-pre-wrap">{text}</p>;
                                            })()}
                                        </div>

                                        {/* Additional metadata tags if available could go here */}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
