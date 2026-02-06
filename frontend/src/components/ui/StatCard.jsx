import React from "react";

export default function StatCard({ number, label, icon, index }) {
  return (
    <div 
      className="stat-item group relative overflow-hidden rounded-2xl border border-yellow-400/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-yellow-400/30 hover:bg-white/10"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
      
      <div className="relative z-10 text-center">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-yellow-400/20">
            {React.cloneElement(icon, { className: "h-6 w-6 text-yellow-400" })}
          </div>
        </div>
        
        {/* Number */}
        <div className="mb-3 text-5xl font-bold text-yellow-400 transition-transform duration-300 group-hover:scale-110">
          {number}
        </div>
        
        {/* Label */}
        <p className="text-sm text-zinc-300 leading-relaxed">
          {label}
        </p>
      </div>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </div>
  );
}
