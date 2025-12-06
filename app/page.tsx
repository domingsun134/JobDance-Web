'use client';

import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
            backgroundSize: "140px 140px",
          }}
        />
        <div className="absolute -top-32 -left-10 h-96 w-96 rounded-full bg-purple-500/30 blur-[140px]" />
        <div className="absolute bottom-0 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[200px]" />
      </div>
      <div className="relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}

