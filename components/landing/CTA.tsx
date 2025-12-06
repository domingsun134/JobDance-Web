'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import Link from 'next/link';

export function CTA() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    const benefits: string[] = [];

    return (
        <section className="relative py-32 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-cyan-600/20 to-pink-600/20" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-full blur-3xl"
                    style={{
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                />
            </div>

            <div className="relative container mx-auto px-4">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                    style={{
                        willChange: 'opacity, transform',
                    }}
                >
                    <div className="relative p-12 md:p-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            style={{
                                willChange: 'opacity, transform',
                            }}
                        >
                            <h2 className="text-5xl md:text-6xl text-white mb-6">
                                Ready to Transform Your{' '}
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                    Career?
                                </span>
                            </h2>

                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                                Join 50,000+ professionals who have already accelerated their career growth with JobDance.ai
                            </p>


                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                                style={{
                                    willChange: 'opacity, transform',
                                }}
                            >
                                <Link href="/auth/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full text-lg flex items-center justify-center gap-3 group"
                                    >
                                        Get Started
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
