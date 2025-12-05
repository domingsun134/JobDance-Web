'use client';

import Logo from '@/components/Logo';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
    const links = {
        product: ['Features', 'Pricing', 'Templates', 'Integrations'],
        company: ['About', 'Blog', 'Careers', 'Press'],
        resources: ['Documentation', 'Help Center', 'Community', 'Contact'],
        legal: ['Privacy', 'Terms', 'Security', 'Cookies']
    };

    const socials = [
        { icon: Twitter, href: '#' },
        { icon: Linkedin, href: '#' },
        { icon: Github, href: '#' },
        { icon: Mail, href: '#' }
    ];

    return (
        <footer className="relative bg-black border-t border-white/10">
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
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

                    {/* Links */}
                    <div>
                        <h3 className="text-white mb-4">Product</h3>
                        <ul className="space-y-3">
                            {links.product.map((link, index) => (
                                <li key={index}>
                                    <motion.a
                                        href="#"
                                        whileHover={{ x: 5 }}
                                        className="text-gray-400 hover:text-white transition-colors inline-block"
                                    >
                                        {link}
                                    </motion.a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            {links.company.map((link, index) => (
                                <li key={index}>
                                    <motion.a
                                        href="#"
                                        whileHover={{ x: 5 }}
                                        className="text-gray-400 hover:text-white transition-colors inline-block"
                                    >
                                        {link}
                                    </motion.a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {links.resources.map((link, index) => (
                                <li key={index}>
                                    <motion.a
                                        href="#"
                                        whileHover={{ x: 5 }}
                                        className="text-gray-400 hover:text-white transition-colors inline-block"
                                    >
                                        {link}
                                    </motion.a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {links.legal.map((link, index) => (
                                <li key={index}>
                                    <motion.a
                                        href="#"
                                        whileHover={{ x: 5 }}
                                        className="text-gray-400 hover:text-white transition-colors inline-block"
                                    >
                                        {link}
                                    </motion.a>
                                </li>
                            ))}
                        </ul>
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
            </div>
        </footer>
    );
}
