'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import ResumePreview from '@/components/ResumePreview';
import { getUserProfile, updateUserProfile, UserProfile, getCurrentUser } from '@/lib/auth';
import { FiSend, FiUser, FiCpu, FiDownload, FiMenu } from 'react-icons/fi';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ResumeBuilderPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

                // Initial greeting
                setMessages([
                    {
                        role: 'assistant',
                        content: "Hello! I'm your Resume Builder AI. I'm here to help you create a professional resume. Let's start with your work experience. What was your most recent job?"
                    }
                ]);
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
                        const existingIndex = newWorkExp.findIndex(
                            (exp) => exp.company.toLowerCase() === newExp.company.toLowerCase()
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

                if (data.extractedData.education) {
                    const newEducation = [...(updatedProfile.education || [])];

                    data.extractedData.education.forEach((newEdu: any) => {
                        const existingIndex = newEducation.findIndex(
                            (edu) => edu.institution.toLowerCase() === newEdu.institution.toLowerCase()
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
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 md:flex-row h-full md:pl-64 transition-all duration-300">

                {/* Mobile Header */}
                <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300">
                        <FiMenu size={24} />
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-white">Resume Builder</h1>
                    <div className="w-6"></div> {/* Spacer */}
                </div>

                {/* Left Panel: Chat Interface */}
                <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 h-[50vh] md:h-full">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                <FiCpu />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your answer..."
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiSend size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Resume Preview */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-y-auto p-4 md:p-8 h-[50vh] md:h-full border-t md:border-t-0 border-gray-200 dark:border-gray-700">
                    <div className="max-w-[210mm] mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Live Preview</h2>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <FiDownload size={16} />
                                <span>Export PDF</span>
                            </button>
                        </div>
                        <div className="shadow-2xl rounded-lg overflow-hidden">
                            <ResumePreview profile={profile} />
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
