'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import ResumePreview, { TemplateType } from '@/components/ResumePreview';
import { getUserProfile, updateUserProfile, UserProfile, getCurrentUser } from '@/lib/auth';
import { FiSend, FiUser, FiCpu, FiDownload, FiMenu } from 'react-icons/fi';

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

    const inputRef = useRef<HTMLInputElement>(null);

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

    const handleExportPDF = async () => {
        const element = document.getElementById('resume-preview');
        if (!element) return;

        setIsExporting(true);
        try {
            // Clone the element to ensure we capture the full height without scrollbars
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '0';
            clone.style.width = '210mm'; // Force A4 width
            clone.style.height = 'auto';
            clone.style.overflow = 'visible'; // Ensure no clipping
            document.body.appendChild(clone);

            // --- Smart Pagination Logic ---
            const A4_HEIGHT_PX = 1123; // Approx height of A4 at 96 DPI (297mm)
            const PAGE_MARGIN_PX = 40; // Top/Bottom margin buffer
            const CONTENT_HEIGHT_PER_PAGE = A4_HEIGHT_PX - (PAGE_MARGIN_PX * 2);

            const blocks = clone.querySelectorAll('.resume-block');
            let currentPageHeight = 0;

            blocks.forEach((block) => {
                const htmlBlock = block as HTMLElement;
                const blockHeight = htmlBlock.offsetHeight;

                // Check if adding this block exceeds the current page height
                if (currentPageHeight + blockHeight > CONTENT_HEIGHT_PER_PAGE) {
                    // It exceeds, so we need to push this block to the next page
                    // Calculate how much space is left on the current page
                    const spacerHeight = A4_HEIGHT_PX - currentPageHeight;

                    // Create a spacer div
                    const spacer = document.createElement('div');
                    spacer.style.height = `${spacerHeight}px`;
                    spacer.style.width = '100%';
                    spacer.style.display = 'block';

                    // Insert spacer before the current block
                    htmlBlock.parentNode?.insertBefore(spacer, htmlBlock);

                    // Reset current page height to start of new page + this block's height
                    currentPageHeight = blockHeight;
                } else {
                    // It fits, just add to height
                    currentPageHeight += blockHeight;
                }
            });
            // -----------------------------

            const canvas = await html2canvas(clone, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                windowWidth: clone.scrollWidth,
                windowHeight: clone.scrollHeight
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add subsequent pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // Shift image up
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, - (pageHeight * Math.ceil((imgHeight - heightLeft) / pageHeight)), imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('resume.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

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
                                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                        {(['modern', 'professional', 'creative'] as TemplateType[]).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedTemplate(t)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedTemplate === t
                                                    ? 'bg-cyan-500 text-white shadow-lg'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <div className="mx-auto max-w-[210mm]">
                                    <div id="resume-preview" className="overflow-hidden rounded-xl bg-white shadow-2xl">
                                        <ResumePreview profile={profile} template={selectedTemplate} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> {/* close flex container */}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
