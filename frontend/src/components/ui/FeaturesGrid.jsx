import { MapPin, Brain, BarChart3, TrendingUp, Zap, Target } from 'lucide-react';

export default function FeaturesGrid() {
  const features = [
    {
      icon: MapPin,
      title: 'Select Location',
      description: 'Choose your desired business location on the interactive map powered by advanced geospatial data'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Google Gemini AI analyzes demographics, competition, foot traffic, and market potential'
    },
    {
      icon: BarChart3,
      title: 'Business Metrics',
      description: 'Get detailed profitability projections, revenue estimates, and cost breakdowns'
    },
    {
      icon: TrendingUp,
      title: 'Make Decision',
      description: 'Review AI-powered insights and make data-driven decisions for your business'
    },
    {
      icon: Zap,
      title: 'Real-time Data',
      description: 'Access live market data and trends to stay ahead of the competition'
    },
    {
      icon: Target,
      title: 'Precision Targeting',
      description: 'Identify the perfect location with pinpoint accuracy and comprehensive analysis'
    }
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-8">
          <h2 className="text-balance text-4xl font-medium text-white lg:text-5xl">
            Simple, Powerful Process
          </h2>
          <p className="text-zinc-400">
            Everything you need to make data-driven location decisions for your business success
          </p>
        </div>

        <div className="relative mx-auto grid max-w-2xl lg:max-w-4xl divide-x divide-y divide-yellow-400/10 border border-yellow-400/10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="space-y-3 p-8 md:p-12 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-800/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
