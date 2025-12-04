'use client';

import Logo from '@/components/Logo';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Hero() {
    const [isMobile, setIsMobile] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const updateMatch = () => setIsMobile(mediaQuery.matches);

        updateMatch();
        mediaQuery.addEventListener('change', updateMatch);

        return () => mediaQuery.removeEventListener('change', updateMatch);
    }, []);

    const reduceMotion = prefersReducedMotion || isMobile;

    const fadeInUp = (delay = 0.2) => ({
        initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 30 },
        animate: { opacity: 1, y: 0 },
        transition: {
            delay: reduceMotion ? 0 : delay,
            duration: reduceMotion ? 0.25 : 0.8,
            ease: 'easeOut'
        }
    });

    const primaryOrbAnimation = reduceMotion ? { opacity: 0.25, scale: 1 } : { y: [0, 30, 0], scale: [1, 1.1, 1] };
    const secondaryOrbAnimation = reduceMotion ? { opacity: 0.2, scale: 1 } : { y: [0, -40, 0], scale: [1, 1.2, 1] };
    const orbTransition = reduceMotion ? { duration: 0.01 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' };

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
                aria-hidden="true"
                className={`absolute top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/30 rounded-full ${reduceMotion ? 'blur-2xl' : 'blur-3xl'}`}
                animate={primaryOrbAnimation}
                transition={orbTransition}
                style={{ willChange: reduceMotion ? 'auto' : 'transform' }}
            />
            <motion.div
                aria-hidden="true"
                className={`absolute bottom-16 right-4 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full ${reduceMotion ? 'blur-2xl' : 'blur-3xl'}`}
                animate={secondaryOrbAnimation}
                transition={{ ...orbTransition, duration: reduceMotion ? 0.01 : 10 }}
                style={{ willChange: reduceMotion ? 'auto' : 'transform' }}
            />

            {/* Navigation */}
            <motion.nav
                initial={{ y: reduceMotion ? 0 : -100, opacity: reduceMotion ? 1 : 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0.3 : 0.8, ease: "easeOut" }}
                className="relative container mx-auto px-4 py-6"
            >
                <div className="flex items-center justify-between">
                    <motion.div
                        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                        className="flex items-center"
                    >
                        <Logo orientation="inline" priority />
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
                        <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
                        <Link href="/auth/login">
                            <motion.button
                                whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
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
                        {...fadeInUp(0.2)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-gray-300">AI-Powered Career Enhancement Platform</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        {...fadeInUp(0.4)}
                        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 sm:mb-8 max-w-4xl leading-tight"
                    >
                        <span className="text-white">Transform Your </span>
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Career Journey
                        </span>
                        <span className="text-white"> with AI</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        {...fadeInUp(0.6)}
                        className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 sm:mb-12 max-w-3xl leading-relaxed"
                    >
                        Build standout resumes, master interviews with AI coaching, and land your dream job 3x faster
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        {...fadeInUp(0.8)}
                        className="flex flex-col sm:flex-row gap-4 mb-14 sm:mb-16"
                    >
                        <Link href="/auth/login">
                            <motion.button
                                whileHover={reduceMotion ? undefined : { scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)" }}
                                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full text-lg flex items-center gap-3 group"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        {...fadeInUp(1)}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 pt-8 border-t border-white/10 w-full"
                    >
                        <div className="text-center px-4">
                            <div className="text-4xl text-white mb-2">50K+</div>
                            <div className="text-sm text-gray-400">Active Users</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-4xl text-white mb-2">95%</div>
                            <div className="text-sm text-gray-400">Success Rate</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-4xl text-white mb-2">4.9★</div>
                            <div className="text-sm text-gray-400">User Rating</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            {!reduceMotion && (
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
            )}
        </div>
    );
}
