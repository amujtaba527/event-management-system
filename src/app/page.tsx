'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { School, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Effects - tailored for a prestigious/tech vibe */}
      <div className="absolute inset-0 z-0">
        {/* School Color Accents (Assumed Brick/Red + Blue/Intellectual) */}
        <div className="absolute top-[-20%] left-[-10%] w-150 h-150 bg-red-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-150 h-150 bg-slate-800/30 rounded-full blur-[120px]" />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(circle_at_center,black_40%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 animate-fade-in">
        {/* Organization Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 text-xs font-medium text-slate-300 backdrop-blur-md mb-6 shadow-xl">
          <School className="w-3.5 h-3.5 text-red-400" />
          <span className="tracking-wide uppercase">Brick School • Official Event Portal</span>
        </div>

        {/* Hero Content */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[1.1]">
            Campus Life, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 via-orange-300 to-red-400 animate-gradient-x">
              Elevated.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            The central hub for Brick School events.
            Manage secure ticketing, student check-ins, and campus activities
            with our bespoke digital platform.
          </p>
        </div>

        {/* Main Action */}
        <div className="pt-10 flex flex-col items-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-white text-slate-950 hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] font-semibold rounded-full group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs text-slate-600 uppercase tracking-widest mt-4">
            Authorized Personnel Only
          </p>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-slate-700 text-xs font-mono">
          &copy; {new Date().getFullYear()} Brick School Digital Services.
        </p>
      </div>
    </div>
  );
}
