'use client';

import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useRef } from 'react';

const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Software Engineer at Google',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        content: 'JobDance.ai helped me land my dream job at Google. The AI interview practice was incredibly realistic and gave me the confidence I needed.',
        rating: 5
    },
    {
        name: 'Michael Chen',
        role: 'Product Manager at Amazon',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        content: 'The resume builder is a game-changer. It helped me highlight my achievements in ways I never thought of. Got 3 interview calls in the first week!',
        rating: 5
    },
    {
        name: 'Emily Rodriguez',
        role: 'UX Designer at Meta',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        content: 'Best career investment I ever made. The AI feedback on my interview skills was spot-on and helped me improve dramatically.',
        rating: 5
    }
];

export function Testimonials() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section id="testimonials" className="relative py-32">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent" />

            <div className="relative container mx-auto px-4">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                    style={{
                        willChange: 'opacity, transform',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
                        style={{
                            willChange: 'opacity, transform',
                        }}
                    >
                        <span className="text-green-400 text-sm">SUCCESS STORIES</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-6xl text-white mb-6">
                        Loved by <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Job Seekers</span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        Join thousands who have transformed their careers with JobDance.ai
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="relative group"
                            style={{
                                willChange: 'opacity, transform',
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

                            <div className="relative h-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
                                <Quote className="w-10 h-10 text-purple-400 mb-4 opacity-50" />

                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>

                                <p className="text-gray-300 mb-6 leading-relaxed">{testimonial.content}</p>

                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="text-white">{testimonial.name}</div>
                                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
