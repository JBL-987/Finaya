import {
  ArrowRight,
  MapPin,
  Building2,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const AnalysisGuide = ({
  heading = "How to Analyze Your Business Location",
  steps = [
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Select Location",
      category: "Step 1",
      description: "Click on the map to choose your desired business location",
      action: () => {},
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Business Details",
      category: "Step 2",
      description: "Enter your business type and parameters in the sidebar",
      action: () => {},
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Run Analysis",
      category: "Step 3",
      description: "Click 'Analyze Location' to get AI-powered insights",
      action: () => {},
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Review Metrics",
      category: "Step 4",
      description: "Examine profitability scores, revenue projections, and risk analysis",
      action: () => {},
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Competitor Analysis",
      category: "Step 5",
      description: "View nearby competitors and market saturation data",
      action: () => {},
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Make Decision",
      category: "Step 6",
      description: "Use AI recommendations to make data-driven location decisions",
      action: () => {},
    },
  ],
}) => {
  return (
    <section className="py-12 bg-black">
      <div className="container mx-auto px-0 md:px-8">
        <h2 className="mb-8 px-4 text-2xl font-semibold text-white md:mb-10 md:text-3xl">
          {heading}
        </h2>
        <div className="flex flex-col">
          <Separator className="bg-neutral-900" />
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex items-start gap-4 px-4 py-6 hover:bg-neutral-900/50 transition-colors group">
                {/* Icon */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all duration-300 border border-yellow-500/20">
                  {step.icon}
                </span>
                
                {/* Content */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white text-base tracking-tight">
                      {step.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800 line-clamp-1 shrink-0">
                      {step.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && <Separator className="bg-neutral-900/50" />}
            </React.Fragment>
          ))}

        </div>
      </div>
    </section>
  );
};
