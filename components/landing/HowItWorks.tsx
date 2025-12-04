'use client';

import { motion, useInView } from 'framer-motion';
import { UserPlus, FileEdit, Video, Briefcase } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        icon: UserPlus,
        title: 'Create Profile',
        description: 'Sign up and tell us about your career goals and experience',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: FileEdit,
        title: 'Build Resume',
        description: 'AI generates a professional, ATS-friendly resume in minutes',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        icon: Video,
        title: 'Practice Interviews',
        description: 'Master your interview skills with AI-powered mock sessions',
        color: 'from-orange-500 to-red-500'
    },
    {
        icon: Briefcase,
        title: 'Land Your Job',
        description: 'Apply with confidence and track your success journey',
        color: 'from-green-500 to-emerald-500'
    }
];

export function HowItWorks() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section id="how-it-works" className="relative py-32 bg-gradient-to-b from-black via-cyan-950/10 to-black overflow-hidden">
            {/* Animated background elements */}
            <motion.div
                animate={{
                    rotate: [0, 360],
                }}
                transition={{
                    duration: 50,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-purple-500/10 rounded-full"
            />

            <div className="relative container mx-auto px-4">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.6 }}
                        className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6"
                    >
                        <span className="text-cyan-400 text-sm">HOW IT WORKS</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-6xl text-white mb-6">
                        Simple Steps to <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Success</span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        Get started in minutes and transform your career trajectory
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 transform -translate-y-1/2" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="relative"
                            >
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300"
                                >
                                    {/* Step number */}
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-black to-gray-900 border-2 border-purple-500 rounded-xl flex items-center justify-center">
                                        <span className="text-xl text-white">{index + 1}</span>
                                    </div>

                                    {/* Icon */}
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-6 mt-4`}
                                    >
                                        <step.icon className="w-8 h-8 text-white" />
                                    </motion.div>

                                    <h3 className="text-2xl text-white mb-3">{step.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                                </motion.div>

                                {/* Arrow connector */}
                                {index < steps.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                        transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                                        className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
