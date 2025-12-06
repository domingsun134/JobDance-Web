'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import ResumePreview, { TemplateType } from '@/components/ResumePreview';
import { getUserProfile, updateUserProfile, UserProfile, getCurrentUser } from '@/lib/auth';
import { FiSend, FiUser, FiCpu, FiDownload, FiMenu, FiFileText } from 'react-icons/fi';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const glassPanel =
    "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.45)]";
const subtleCard =
    "rounded-3xl border border-white/10 bg-black/35 backdrop-blur-2xl";

export default function ResumeBuilderPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');
    const [showToast, setShowToast] = useState(false);
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleGenerateCoverLetter = async () => {
        if (!profile) return;
        setGeneratingCoverLetter(true);
        try {
            const res = await fetch("/api/cover-letter/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userProfile: profile,
                    jobDescription: "" // Optional: could add a modal to ask for this later
                })
            });

            const data = await res.json();
            if (res.ok && data.coverLetter) {
                setCoverLetter(data.coverLetter);
                // Save to profile
                const updatedProfile = { ...profile, coverLetter: data.coverLetter };
                setProfile(updatedProfile);
                await updateUserProfile(updatedProfile);
            } else {
                console.error("API Error:", data.error);
                alert("Failed to generate cover letter: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Generation error:", error);
            alert("Failed to generate cover letter. Please try again.");
        } finally {
            setGeneratingCoverLetter(false);
        }
    };

    // Initial load
    useEffect(() => {
        async function loadData() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth/login');
                    return;
                }

                const userProfile = await getUserProfile();
                setProfile(userProfile);
                // Load cover letter if exists
                if (userProfile?.coverLetter) {
                    setCoverLetter(userProfile.coverLetter);
                }

                // Check if profile has any meaningful data
                const hasData = userProfile && (
                    (userProfile.workExperience && userProfile.workExperience.length > 0) ||
                    (userProfile.education && userProfile.education.length > 0) ||
                    (userProfile.skills && userProfile.skills.length > 0) ||
                    (userProfile.languages && userProfile.languages.length > 0) ||
                    (userProfile.personalInfo && Object.values(userProfile.personalInfo).some(val => val && val.length > 0))
                );

                if (hasData) {
                    // Profile exists, ask AI to review it and greet accordingly
                    try {
                        const response = await fetch('/api/resume/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [{
                                    role: 'user',
                                    content: "I am returning to continue my resume. Please review my current data (provided in system context). CRITICAL: If my Name, Phone, or Email is missing, YOU MUST ASK FOR THEM FIRST before suggesting anything else. If personal info is complete, suggest what I should add next or ask if I want to refine existing sections. Be concise and welcoming."
                                }],
                                currentProfile: userProfile
                            }),
                        });

                        const data = await response.json();
                        if (data.response) {
                            setMessages([{ role: 'assistant', content: data.response }]);
                        } else {
                            // Fallback if API fails to return response
                            setMessages([{
                                role: 'assistant',
                                content: "Welcome back! I see you've already started your resume. What would you like to work on next?"
                            }]);
                        }
                    } catch (err) {
                        console.error("Error getting initial AI greeting:", err);
                        // Fallback on error
                        setMessages([{
                            role: 'assistant',
                            content: "Welcome back! I see you've already started your resume. What would you like to work on next?"
                        }]);
                    }
                } else {
                    // Empty profile, standard greeting
                    setMessages([
                        {
                            role: 'assistant',
                            content: "Hello! I'm your Resume Builder AI. I'm here to help you create a professional resume. Let's start with your work experience. What was your most recent job?"
                        }
                    ]);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [router]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when not typing
    useEffect(() => {
        if (!isTyping) {
            inputRef.current?.focus();
        }
    }, [isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        try {
            // Prepare context
            // We send the last 10 messages to keep context window manageable but sufficient
            const contextMessages = [...messages, { role: 'user', content: userMessage }].slice(-10);

            const response = await fetch('/api/resume/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: contextMessages,
                    currentProfile: profile
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

            // Update profile if data was extracted
            if (data.extractedData && profile) {
                const updatedProfile = { ...profile };
                let hasChanges = false;

                // Merge logic
                if (data.extractedData.personalInfo) {
                    updatedProfile.personalInfo = {
                        ...updatedProfile.personalInfo,
                        ...data.extractedData.personalInfo
                    };
                    hasChanges = true;
                }

                if (data.extractedData.workExperience) {
                    const newWorkExp = [...(updatedProfile.workExperience || [])];

                    data.extractedData.workExperience.forEach((newExp: any) => {
                        // Match by Company AND Position to allow multiple roles at same company
                        const existingIndex = newWorkExp.findIndex(
                            (exp) =>
                                exp.company.toLowerCase() === newExp.company.toLowerCase() &&
                                exp.position.toLowerCase() === newExp.position.toLowerCase()
                        );

                        if (existingIndex >= 0) {
                            // Update existing entry
                            newWorkExp[existingIndex] = {
                                ...newWorkExp[existingIndex],
                                ...newExp,
                                // Preserve ID if it exists
                                id: newWorkExp[existingIndex].id
                            };
                        } else {
                            // Add new entry
                            newWorkExp.push(newExp);
                        }
                    });

                    updatedProfile.workExperience = newWorkExp;
                    hasChanges = true;
                }

                if (data.extractedData.deleteWorkExperience) {
                    const currentWorkExp = [...(updatedProfile.workExperience || [])];
                    const initialLength = currentWorkExp.length;

                    const filteredWorkExp = currentWorkExp.filter(exp => {
                        // Check if this experience matches any in the delete list
                        const shouldDelete = data.extractedData.deleteWorkExperience.some((del: any) =>
                            exp.company.toLowerCase() === del.company.toLowerCase() &&
                            (del.position ? exp.position.toLowerCase() === del.position.toLowerCase() : true)
                        );
                        return !shouldDelete;
                    });

                    if (filteredWorkExp.length !== initialLength) {
                        updatedProfile.workExperience = filteredWorkExp;
                        hasChanges = true;
                    }
                }

                if (data.extractedData.education) {
                    const newEducation = [...(updatedProfile.education || [])];

                    data.extractedData.education.forEach((newEdu: any) => {
                        // Match by Institution AND Degree to allow multiple degrees from same uni
                        const existingIndex = newEducation.findIndex(
                            (edu) =>
                                edu.institution.toLowerCase() === newEdu.institution.toLowerCase() &&
                                edu.degree.toLowerCase() === newEdu.degree.toLowerCase()
                        );

                        if (existingIndex >= 0) {
                            // Update existing entry
                            newEducation[existingIndex] = {
                                ...newEducation[existingIndex],
                                ...newEdu,
                                id: newEducation[existingIndex].id
                            };
                        } else {
                            // Add new entry
                            newEducation.push(newEdu);
                        }
                    });

                    updatedProfile.education = newEducation;
                    hasChanges = true;
                }

                if (data.extractedData.deleteEducation) {
                    const currentEducation = [...(updatedProfile.education || [])];
                    const initialLength = currentEducation.length;

                    const filteredEducation = currentEducation.filter(edu => {
                        // Check if this education matches any in the delete list
                        const shouldDelete = data.extractedData.deleteEducation.some((del: any) =>
                            edu.institution.toLowerCase() === del.institution.toLowerCase() &&
                            (del.degree ? edu.degree.toLowerCase() === del.degree.toLowerCase() : true)
                        );
                        return !shouldDelete;
                    });

                    if (filteredEducation.length !== initialLength) {
                        updatedProfile.education = filteredEducation;
                        hasChanges = true;
                    }
                }

                if (data.extractedData.skills) {
                    // Deduplicate skills
                    const newSkills = data.extractedData.skills;
                    const existingSkills = new Set(updatedProfile.skills || []);
                    newSkills.forEach((s: string) => existingSkills.add(s));
                    updatedProfile.skills = Array.from(existingSkills);
                    hasChanges = true;
                }
                if (data.extractedData.languages) {
                    // Simple append for languages for now, could be smarter too
                    const newLanguages = [...(updatedProfile.languages || [])];
                    data.extractedData.languages.forEach((newLang: any) => {
                        const existingIndex = newLanguages.findIndex(
                            (l) => l.name.toLowerCase() === newLang.name.toLowerCase()
                        );
                        if (existingIndex >= 0) {
                            newLanguages[existingIndex] = { ...newLanguages[existingIndex], ...newLang };
                        } else {
                            newLanguages.push(newLang);
                        }
                    });
                    updatedProfile.languages = newLanguages;
                    hasChanges = true;
                }

                if (data.extractedData.coverLetter) {
                    setCoverLetter(data.extractedData.coverLetter);
                    setActiveTab('coverLetter');

                    // Save cover letter to profile
                    updatedProfile.coverLetter = data.extractedData.coverLetter;
                    hasChanges = true;
                }

                if (hasChanges) {
                    console.log("Saving updated profile:", updatedProfile);
                    setProfile(updatedProfile);
                    // Persist to DB
                    await updateUserProfile(updatedProfile);
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsTyping(false);
            // Focus input after response
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const resumePreviewRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = useReactToPrint({
        contentRef: resumePreviewRef,
        documentTitle: `Resume-${profile?.personalInfo?.fullName || 'Draft'}`,
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
            }
        `,
        onBeforeGetContent: () => {
            if (!resumePreviewRef.current) {
                console.error("Print Error: Resume ref is null");
                alert("Error: content to print not found. Please refresh and try again.");
                return Promise.reject("Ref is null");
            }
            setIsExporting(true);
            return Promise.resolve();
        },
        onAfterPrint: () => setIsExporting(false),
        onPrintError: (errorLocation, error) => {
            setIsExporting(false);
            console.error("Print Error:", errorLocation, error);
            alert("Failed to export PDF. Please try again.");
        },
        suppressErrors: false,
    });

    if (loading) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
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
                <div className="relative z-10 h-16 w-16 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-white">
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

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/70 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar />

            <div className="relative z-10 flex h-screen flex-col md:pl-72 overflow-hidden">
                <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col px-4 pb-24 pt-6 md:px-10 md:pb-6 md:h-full">
                    {/* Mobile Header */}
                    <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:hidden">
                        <button onClick={() => setSidebarOpen(true)} className="text-white/70">
                            <FiMenu size={20} />
                        </button>
                        <h1 className="text-base font-semibold text-white">Resume Builder</h1>
                        <div className="w-5" />
                    </div>

                    <div className="flex flex-1 flex-col gap-6 md:flex-row md:min-h-0 md:overflow-hidden">
                        {/* Left Panel: Chat Interface */}
                        <div className={`${glassPanel} flex min-h-[50vh] flex-col md:h-full md:min-h-0 flex-1`}>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-white/10 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
                                        <FiCpu />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                                        <p className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                                            <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                            Online
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-none shadow-[0_10px_30px_rgba(6,182,212,0.35)]'
                                                    : 'rounded-bl-none border border-white/5 bg-white/10 text-white'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="rounded-2xl rounded-bl-none border border-white/10 bg-white/5 px-4 py-3">
                                                <div className="flex gap-1 text-white/70">
                                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"></span>
                                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 delay-100"></span>
                                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 delay-200"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="border-t border-white/10 p-6">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your answer..."
                                        className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                        disabled={isTyping}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isTyping}
                                        className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 p-2 text-white transition hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FiSend size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Resume Preview */}
                        <div className={`${glassPanel} flex min-h-[50vh] flex-col md:h-full md:min-h-0 md:w-[230mm] shrink-0`}>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg font-semibold text-white">Live Preview</h2>

                                    {/* Main Tabs */}
                                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                        <button
                                            onClick={() => setActiveTab('resume')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'resume'
                                                ? 'bg-cyan-500 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            Resume
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('coverLetter')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'coverLetter'
                                                ? 'bg-cyan-500 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            Cover Letter
                                        </button>
                                    </div>

                                    {/* Generate Cover Letter Button */}
                                    {activeTab === 'coverLetter' && (
                                        <button
                                            onClick={handleGenerateCoverLetter}
                                            disabled={generatingCoverLetter}
                                            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {generatingCoverLetter ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                            ) : (
                                                <FiSend size={12} />
                                            )}
                                            <span>{generatingCoverLetter ? 'Generating...' : 'Generate with Profile'}</span>
                                        </button>
                                    )}

                                    {/* Template Selector (Only for Resume) */}
                                    {activeTab === 'resume' && (
                                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                            {(['modern', 'professional', 'creative'] as TemplateType[]).map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setSelectedTemplate(t)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedTemplate === t
                                                        ? 'bg-purple-500 text-white shadow-lg'
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'resume' ? (
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isExporting ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-cyan-400"></div>
                                        ) : (
                                            <FiDownload size={16} />
                                        )}
                                        <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (coverLetter) {
                                                navigator.clipboard.writeText(coverLetter);
                                                setShowToast(true);
                                                setTimeout(() => setShowToast(false), 3000);
                                            }
                                        }}
                                        disabled={!coverLetter}
                                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FiFileText size={16} />
                                        <span>Copy Text</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <div className="mx-auto max-w-[210mm] p-6">
                                    {activeTab === 'resume' ? (
                                        <div ref={resumePreviewRef} id="resume-preview" className="overflow-hidden rounded-xl bg-white shadow-2xl">
                                            <ResumePreview profile={profile} template={selectedTemplate} />
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-white p-12 shadow-2xl min-h-[297mm] text-black">
                                            {coverLetter ? (
                                                <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed">
                                                    {coverLetter}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                                                    <FiFileText size={48} className="mb-4 opacity-50" />
                                                    <p className="text-lg font-medium">No cover letter generated yet</p>
                                                    <p className="text-sm mt-2">Ask the AI assistant to generate one for you once your profile is complete.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div> {/* close flex container */}
                </div>
            </div>

            <BottomNav />

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-24 right-8 z-50 animate-fade-in-up">
                    <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/90 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                            <FiFileText size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Copied to clipboard!</p>
                            <p className="text-xs text-white/60">Cover letter is ready to paste</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
