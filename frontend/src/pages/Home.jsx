import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Brain,
  Target,
  ArrowRight,
  TrendingUp,
  Zap,
  MapPin,
} from "lucide-react";
import * as flags from 'country-flag-icons/react/3x2';
import AuthModal from "../components/AuthModal";
import Marquee from "react-fast-marquee";
import GlassmorphismHero from "../components/ui/GlassmorphismHero";
import StatCard from "../components/ui/StatCard";

export default function Home({ login, register, guestLogin }) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // GSAP Animations
  useEffect(() => {
    const loadGSAP = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');

        gsap.registerPlugin(ScrollTrigger);

        // Stats animation
        gsap.fromTo('.stat-item',
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            scrollTrigger: {
              trigger: '#problem',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // Features animation
        gsap.fromTo('.feature-card',
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#features',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // How it works animation
        gsap.fromTo('.step-item',
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.15,
            scrollTrigger: {
              trigger: '#how-it-works',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // Countries animation
        gsap.fromTo('.country-card',
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.05,
            scrollTrigger: {
              trigger: '#countries',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        // CTA animation
        gsap.fromTo('.cta-content',
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            scrollTrigger: {
              trigger: '#cta',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse'
            }
          }
        );

      } catch (error) {
        console.error('Error loading GSAP:', error);
      }
    };

    loadGSAP();
  }, []);

  // Smooth scrolling implementation
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.replace('#', '');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  // Data Features - PRESERVED TEXT CONTENT
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Location Analysis',
      description: 'Advanced geospatial analysis using Google Gemini AI to evaluate business locations based on demographics, competition, and foot traffic patterns',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Smart Business Metrics',
      description: 'Comprehensive profitability calculations including revenue projections, cost analysis, and ROI estimates tailored to your specific location',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Interactive Map Visualization',
      description: 'Real-time interactive maps showing key business indicators, competitor locations, and area demographics',
    }
  ];

  const stats = [
    { number: "82%", label: "Businesses fail due to poor location choice", icon: <Target className="h-8 w-8" /> },
    { number: "3x", label: "Higher success rate with location analysis", icon: <TrendingUp className="h-8 w-8" /> },
    { number: "50+", label: "Data points analyzed per location", icon: <Zap className="h-8 w-8" /> },
    { number: "AI", label: "Powered by Google Gemini", icon: <Brain className="h-8 w-8" /> }
  ];

  const countries = [
    { Flag: flags.ID, name: 'Indonesia' },
    { Flag: flags.TH, name: 'Thailand' },
    { Flag: flags.VN, name: 'Vietnam' },
    { Flag: flags.PH, name: 'Philippines' },
    { Flag: flags.MY, name: 'Malaysia' },
    { Flag: flags.SG, name: 'Singapore' },
    { Flag: flags.JP, name: 'Japan' },
    { Flag: flags.KR, name: 'South Korea' },
    { Flag: flags.AU, name: 'Australia' },
    { Flag: flags.BN, name: 'Brunei' },
    { Flag: flags.KH, name: 'Cambodia' },
    { Flag: flags.CN, name: 'China' },
    { Flag: flags.HK, name: 'Hong Kong' },
    { Flag: flags.IN, name: 'India' },
    { Flag: flags.LA, name: 'Laos' },
    { Flag: flags.MO, name: 'Macau' },
    { Flag: flags.MN, name: 'Mongolia' },
    { Flag: flags.MM, name: 'Myanmar' },
    { Flag: flags.NZ, name: 'New Zealand' },
    { Flag: flags.TW, name: 'Taiwan' },
    { Flag: flags.TL, name: 'Timor-Leste' },
  ];

  return (
    <main className="overflow-hidden bg-black">
      {/* Modern Glassmorphism Hero Section */}
      <GlassmorphismHero onGetStarted={() => setShowAuthModal(true)} onGuestLogin={guestLogin} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        login={login}
        register={register}
      />

      {/* Stats Problem Section - Modern Glassmorphism */}
      <section id="problem" className="relative py-24 px-4 bg-black overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url(https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80)] bg-cover bg-center opacity-5 grayscale" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Why Location Matters
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Critical factors that determine business success through strategic location selection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                number={stat.number}
                label={stat.label}
                icon={stat.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Combined Features Section - Boxy Grid Design */}
      <section id="features" className="relative py-24 px-4 bg-black overflow-hidden">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Comprehensive tools and AI-powered analysis for data-driven location decisions
            </p>
          </div>

          {/* Main Features Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-0 border border-yellow-400/20">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`
                  p-10 bg-neutral-950/50 backdrop-blur-sm
                  border-yellow-400/20
                  ${index % 3 !== 2 ? 'border-r' : ''}
                  ${index < 3 ? 'border-b' : ''}
                  hover:bg-neutral-900/50 transition-all duration-300 group
                `}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-yellow-400/20 border-t-0">
            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm border-r border-b border-yellow-400/20 hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Select Location</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Choose your desired business location on the interactive map powered by advanced geospatial data
                </p>
              </div>
            </div>

            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm border-r border-b border-yellow-400/20 hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <Brain className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">AI Analysis</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Google Gemini AI analyzes demographics, competition, foot traffic, and market potential
                </p>
              </div>
            </div>

            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm border-b border-yellow-400/20 hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Business Metrics</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Get detailed profitability projections, revenue estimates, and cost breakdowns
                </p>
              </div>
            </div>

            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm border-r border-yellow-400/20 hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Make Decision</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Review AI-powered insights and make data-driven decisions for your business
                </p>
              </div>
            </div>

            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm border-r border-yellow-400/20 hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Real-time Data</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Access live market data and trends to stay ahead of the competition
                </p>
              </div>
            </div>

            <div className="p-10 bg-neutral-950/30 backdrop-blur-sm hover:bg-neutral-900/40 transition-all duration-300 group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400/10">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Precision Targeting</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Identify the perfect location with pinpoint accuracy and comprehensive analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Section - Modern Glassmorphism */}
      <section id="countries" className="relative py-24 bg-black px-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/5 to-transparent" />
        
        <div className="relative z-10 w-full mx-auto">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Global Coverage
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Analyze business locations worldwide with comprehensive geospatial data
            </p>
          </div>
          
          {/* Horizontal Infinite Marquee Countries */}
          <Marquee gradient={false} speed={40} pauseOnHover className="!w-full">
            {countries.map((country, index) => (
              <div key={index} className="country-card text-center p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-yellow-400/10 hover:border-yellow-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 hover:scale-105 group w-36 flex-shrink-0 mx-6 my-4">
                <div className="mb-3 flex justify-center items-center h-12">
                  <country.Flag className="w-16 h-12 object-cover rounded shadow-sm group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{country.name}</div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* CTA Section - Modern Glassmorphism */}
      <section id="cta" className="relative py-24 px-4 bg-black overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-yellow-500/10 to-amber-500/20" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url(https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80)] bg-cover bg-center opacity-10" />
        
        <div className="cta-content relative z-10 max-w-4xl mx-auto text-center">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-600/10 to-amber-600/10 backdrop-blur-xl p-12 shadow-2xl">
            {/* Glow Effects */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Make Smarter Location Decisions Today
              </h2>
              <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                Join businesses worldwide using AI-powered geospatial analysis to find the perfect location
              </p>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-full bg-yellow-400 text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-yellow-400 flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              >
                <BarChart3 className="w-5 h-5" />
                Get Started Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
