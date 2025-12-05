'use client';

import Logo from '@/components/Logo';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
    const socials = [
        { icon: Twitter, href: '#' },
        { icon: Linkedin, href: '#' },
        { icon: Github, href: '#' },
        { icon: Mail, href: '#' }
    ];

    return (
        <footer className="relative bg-black border-t border-white/10">
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <motion.div whileHover={{ scale: 1.02 }} className="mb-6">
                            <Logo orientation="inline" className="gap-2" />
                        </motion.div>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Empowering job seekers with AI-powered tools to accelerate their career growth and land their dream jobs.
                        </p>
                        <div className="flex gap-3">
                            {socials.map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 hover:border-purple-500/50 transition-all group"
                                >
                                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2024 JobDance.ai. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-sm">
                        Built with ❤️ for job seekers worldwide
                    </p>
                </div>

                {/* Terms and Privacy Links */}
                <div className="pt-4 text-center">
                    <p className="text-xs text-gray-500">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
