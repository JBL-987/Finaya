import React from "react";

export default function FeatureCard({ icon, title, description, index }) {
  return (
    <div 
      className="feature-card group relative overflow-hidden rounded-3xl border border-yellow-400/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-yellow-400/30 hover:bg-white/10"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-yellow-400/0 blur-3xl transition-all duration-500 group-hover:bg-yellow-400/10" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon Container */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/10 ring-1 ring-yellow-400/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-yellow-400/20 group-hover:ring-yellow-400/40">
          {React.cloneElement(icon, { className: "h-8 w-8 text-yellow-400" })}
        </div>
        
        {/* Title */}
        <h3 className="mb-4 text-2xl font-bold text-white transition-colors group-hover:text-yellow-100">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-zinc-400 leading-relaxed transition-colors group-hover:text-zinc-300">
          {description}
        </p>
      </div>
      
      {/* Bottom Border Accent */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500 group-hover:w-full" />
    </div>
  );
}
