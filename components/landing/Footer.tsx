'use client';

import Link from 'next/link';
import { Linkedin } from 'lucide-react';

export function Footer() {
    const socials = [
        { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/jobdance/' }
    ];

    return (
        <footer className="relative border-t border-white/10 bg-black pt-16 pb-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded-sm bg-blue-500" />
                                <div className="h-3 w-3 rounded-sm bg-blue-400" />
                                <div className="h-3 w-3 rounded-sm bg-indigo-500" />
                                <div className="h-3 w-3 rounded-sm bg-purple-500" />
                                <div className="h-3 w-3 rounded-sm bg-pink-500" />
                            </div>
                            <span className="text-xl font-bold text-white">
                                JobDance<span className="text-blue-500">.ai</span>
                            </span>
                        </Link>
                        <p className="text-sm leading-6 text-gray-400 max-w-sm">
                            Empowering job seekers with AI-powered tools to accelerate their career growth and land their dream jobs.
                        </p>
                        <div className="flex space-x-4">
                            {socials.map((item) => (
                                <a key={item.name} href={item.href} className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">{item.name}</span>
                                    <item.icon className="h-5 w-5" aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {['Features', 'Pricing', 'Templates', 'Integrations'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-sm leading-6 text-gray-400 hover:text-white transition-colors">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-sm leading-6 text-gray-400 hover:text-white transition-colors">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Resources</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {['Documentation', 'Help Center', 'Community', 'Contact'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-sm leading-6 text-gray-400 hover:text-white transition-colors">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {['Privacy', 'Terms', 'Security', 'Cookies'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-sm leading-6 text-gray-400 hover:text-white transition-colors">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs leading-5 text-gray-400">
                        &copy; {new Date().getFullYear()} JobDance.ai. All rights reserved.
                    </p>
                    <p className="text-xs leading-5 text-gray-400 flex items-center gap-1">
                        Built with <span className="text-red-500">♥</span> for job seekers worldwide
                    </p>
                </div>
            </div>
        </footer>
    );
}
