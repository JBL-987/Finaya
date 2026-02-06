import React from "react";
import { 
  ArrowRight, 
  Target, 
  Star,
  BarChart3,
  Brain,
  TrendingUp,
  Zap
} from "lucide-react";
import { Typewriter } from "./Typewriter";

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">{label}</span>
  </div>
);

// --- MAIN COMPONENT ---
export default function GlassmorphismHero({ onGetStarted }) {
  return (
    <div className="relative w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* 
        SCOPED ANIMATIONS 
      */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div 
        className="absolute inset-0 z-0 bg-[url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80)] bg-cover bg-center opacity-30"
        style={{
          maskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 md:pt-32 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            
            {/* Heading with Typewriter */}
            <h1 
              className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tighter leading-[0.9]"
              style={{
                maskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)"
              }}
            >
              <span className="block mb-2">AI-Powered</span>
              <Typewriter
                text={["Business Location", "Market Analysis", "Success Strategy"]}
                speed={80}
                className="bg-gradient-to-br from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent"
                waitTime={2000}
                deleteSpeed={50}
                cursorChar={"_"}
                cursorClassName="text-yellow-400"
              />
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-xl text-lg text-zinc-400 leading-relaxed">
              Make smarter location decisions with Google Gemini AI-powered geospatial analysis, profitability projections, and comprehensive market insights
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="rounded-full bg-yellow-400 text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-yellow-400 flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <a
                href="#features"
                className="rounded-full bg-transparent text-white border border-white/20 transition-all duration-300 ease-out transform hover:scale-105 hover:bg-yellow-400 hover:text-black hover:border-transparent flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg backdrop-blur-sm"
              >
                Learn More
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5 space-y-6 lg:mt-12">
            
            {/* Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-yellow-400/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 ring-1 ring-yellow-400/20">
                    <Target className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">82%</div>
                    <div className="text-sm text-zinc-400">Fail Rate</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Success with Analysis</span>
                    <span className="text-white font-medium">3x Higher</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/50">
                    <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-6" />

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="50+" label="Data Points" />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="AI" label="Powered" />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="24/7" label="Support" />
                </div>

                {/* Tag Pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1 text-[10px] font-medium tracking-wide text-yellow-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    LIVE
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1 text-[10px] font-medium tracking-wide text-yellow-300">
                    GOOGLE GEMINI
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-yellow-400/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-medium text-zinc-400">Why Location Matters</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10">
                    <TrendingUp className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">3x</div>
                    <div className="text-xs text-zinc-400">Higher Success</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10">
                    <Zap className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-xs text-zinc-400">Data Points</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
