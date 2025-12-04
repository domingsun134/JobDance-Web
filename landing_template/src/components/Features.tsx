import { motion, useInView } from 'motion/react';
import { FileText, Video, Zap, Target, Brain, Shield } from 'lucide-react';
import { useRef } from 'react';

const features = [
  {
    icon: Brain,
    title: 'AI Resume Builder',
    description: 'Create ATS-optimized resumes with intelligent suggestions tailored to your target role',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Video,
    title: 'Mock Interviews',
    description: 'Practice with AI-powered interviews that adapt to your industry and skill level',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Get real-time analysis on your answers, communication skills, and body language',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Target,
    title: 'Job Matching',
    description: 'AI-powered job recommendations that perfectly match your skills and aspirations',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: FileText,
    title: 'Cover Letters',
    description: 'Generate compelling cover letters that highlight your unique value proposition',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Bank-level encryption ensures your data is always secure and confidential',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"
        style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}
      />
      <div className="relative h-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
        <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <feature.icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-2xl text-white mb-3">{feature.title}</h3>
        <p className="text-gray-400 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="features" className="relative py-32 bg-black">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
      
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
            className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6"
          >
            <span className="text-purple-400 text-sm">POWERFUL FEATURES</span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl text-white mb-6">
            Everything You Need to <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p className="text-xl text-gray-400">
            Cutting-edge AI tools designed to give you an unfair advantage in your job search
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
