"use client";

import React, { useState, useEffect } from "react";
import { FiSend, FiDownload, FiCopy, FiSave, FiRefreshCw } from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function CoverLetterPage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Glassmorphism styles matching dashboard
    const glassPanel = "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.45)]";
    const inputStyle = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300";

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const profile = await getUserProfile();
            if (profile) {
                setUserProfile(profile);
                if (profile.coverLetter) {
                    setCoverLetter(profile.coverLetter);
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!userProfile) return;

        setGenerating(true);
        try {
            const res = await fetch("/api/cover-letter/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userProfile,
                    jobDescription
                })
            });

            const data = await res.json();
            if (res.ok && data.coverLetter) {
                setCoverLetter(data.coverLetter);
                // Auto-save generated letter
                handleSave(data.coverLetter);
            } else {
                console.error("API Error:", data.error);
                alert("Failed to generate cover letter: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Generation error:", error);
            alert("Failed to generate cover letter. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async (content: string = coverLetter) => {
        if (!userProfile) return;

        try {
            const updatedProfile = { ...userProfile, coverLetter: content };
            await updateUserProfile(updatedProfile);
            setLastSaved(new Date());
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        // Show brief toast/feedback
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-white/40 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-[#0f172a] overflow-hidden text-neutral-200 font-sans selection:bg-blue-500/30">
                <Sidebar />
                <main className="flex-1 flex flex-col relative overflow-hidden md:pl-64">
                    {/* Background Gradients */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10 w-full max-w-7xl mx-auto">
                        <header className="mb-10">
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent mb-4 tracking-tight">
                                AI Cover Letter
                            </h1>
                            <p className="text-lg text-white/40 max-w-2xl leading-relaxed">
                                Instantly generate a personalized cover letter tailored to your dream job using your resume profile.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
                            {/* Input Panel */}
                            <div className={`${glassPanel} p-8 flex flex-col gap-6`}>
                                <div className="flex items-center gap-3 text-white/80 mb-2">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                                        <FiRefreshCw className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-semibold">Job Details</h2>
                                </div>

                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex flex-col gap-2 h-full">
                                        <label className="text-sm font-medium text-white/50 ml-1">
                                            Job Description (Optional)
                                        </label>
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the job description here (e.g., 'Senior Frontend Engineer at Google...'). If left empty, a general application letter will be generated."
                                            className={`${inputStyle} flex-1 resize-none min-h-[200px] text-base leading-relaxed`}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-lg shadow-lg 
                                        flex items-center justify-center gap-3 transition-all duration-300
                                        ${generating
                                            ? "bg-white/5 text-white/40 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                                        }
                                    `}
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Writing your letter...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="text-xl" />
                                            <span>Generate Cover Letter</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Output Panel */}
                            <div className={`${glassPanel} p-8 flex flex-col gap-6`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3 text-white/80">
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                                            <FiCopy className="text-xl" />
                                        </div>
                                        <h2 className="text-xl font-semibold">Your Letter</h2>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {lastSaved && (
                                            <span className="text-xs text-white/30 mr-2">
                                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleSave()}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                            title="Save"
                                        >
                                            <FiSave className="text-lg" />
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                            title="Copy to Clipboard"
                                        >
                                            <FiCopy className="text-lg" />
                                        </button>
                                    </div>
                                </div>

                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Your generated cover letter will appear here..."
                                    className={`${inputStyle} flex-1 resize-none text-base leading-relaxed p-6 bg-white/5 !border-white/5`}
                                />

                                <div className="text-center text-sm text-white/30">
                                    You can edit this text before copying or saving.
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
                <BottomNav />
            </div>
        </ThemeProvider>
    );
}
