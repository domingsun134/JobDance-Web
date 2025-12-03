'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />

            {/* Animated grid pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Floating orbs */}
            <motion.div
                className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
                animate={{
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                animate={{
                    y: [0, -40, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Navigation */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative container mx-auto px-4 py-6"
            >
                <div className="flex items-center justify-between">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3"
                    >
                        <img src="/logo.png" alt="JobDance.ai" className="w-10 h-10" />
                        <span className="text-2xl text-white">JobDance<span className="text-cyan-400">.ai</span></span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
                        <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
                        <Link href="/auth/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                            >
                                Get Started
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Content */}
            <div className="relative container mx-auto px-4 pt-20 pb-32">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-gray-300">AI-Powered Career Enhancement Platform</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-6xl md:text-7xl lg:text-8xl mb-8 max-w-4xl"
                    >
                        <span className="text-white">Transform Your </span>
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Career Journey
                        </span>
                        <span className="text-white"> with AI</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl leading-relaxed"
                    >
                        Build standout resumes, master interviews with AI coaching, and land your dream job 3x faster
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 mb-16"
                    >
                        <Link href="/auth/login">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)" }}
                                whileTap={{ scale: 0.95 }}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full text-lg flex items-center gap-3 group"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-10 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-full text-lg flex items-center gap-3 hover:bg-white/10 transition-all"
                        >
                            <Play className="w-5 h-5" />
                            Watch Demo
                        </motion.button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="grid grid-cols-3 gap-12 pt-8 border-t border-white/10"
                    >
                        <div className="text-center">
                            <div className="text-4xl text-white mb-2">50K+</div>
                            <div className="text-sm text-gray-400">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl text-white mb-2">95%</div>
                            <div className="text-sm text-gray-400">Success Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl text-white mb-2">4.9★</div>
                            <div className="text-sm text-gray-400">User Rating</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
                >
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1 h-2 bg-white/50 rounded-full"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}
