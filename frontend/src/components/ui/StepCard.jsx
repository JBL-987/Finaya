import React from "react";

export default function StepCard({ step, title, desc, icon, index }) {
  return (
    <div 
      className="step-item group text-center"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="relative mb-6">
        {/* Connecting Line (hidden on last item) */}
        {index < 3 && (
          <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-yellow-400/50 to-transparent lg:block" />
        )}
        
        {/* Step Circle */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-400/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-yellow-400/40">
          {/* Inner Circle */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
            {React.cloneElement(icon, { className: "h-7 w-7 text-yellow-400" })}
          </div>
          
          {/* Step Number Badge */}
          <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-900 shadow-lg">
            {step}
          </div>
        </div>
      </div>
      
      {/* Title */}
      <h4 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-yellow-400">
        {title}
      </h4>
      
      {/* Description */}
      <p className="text-sm leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300">
        {desc}
      </p>
    </div>
  );
}
