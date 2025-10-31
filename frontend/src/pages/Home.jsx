import React, { useState, useEffect } from "react";
import {
  MapPin,
  BarChart3,
  Brain,
  Target,
  ArrowRight,
  TrendingUp,
  Zap,
  Star,
  Calculator,
} from "lucide-react";
import * as flags from 'country-flag-icons/react/3x2';
import AuthModal from "../components/AuthModal";

export default function Home({ login, register }) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // GSAP Animations
  useEffect(() => {
    const loadGSAP = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        
        gsap.registerPlugin(ScrollTrigger);

        // Hero animation
        gsap.fromTo('.hero-title', 
          { opacity: 0, y: 100 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1.2, 
            ease: 'power3.out',
            stagger: 0.2
          }
        );

        gsap.fromTo('.hero-subtitle', 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            delay: 0.6,
            ease: 'power2.out'
          }
        );

        gsap.fromTo('.hero-buttons', 
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            delay: 0.8,
            ease: 'power2.out'
          }
        );

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

        // Testimonials animation
        gsap.fromTo('.testimonial-card', 
          { opacity: 0, y: 40 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8,
            stagger: 0.1,
            scrollTrigger: {
              trigger: '#testimonials',
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

  // Data Features
  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Location Strategist',
      description: 'AI-powered location analysis to help MSMEs identify optimal business locations and assess market potential in specific areas',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Financial Yield Advisor',
      description: 'Smart financial automation that analyzes yield potential and provides strategic financial advice for optimized returns',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Automation Tools',
      description: 'Streamline financial workflows with intelligent automation for reporting and compliance',
    }
  ];

  const stats = [
    { number: "70%", label: "Inadequate financial planning", icon: <Target className="h-8 w-8" /> },
    { number: "25%", label: "Yield optimized with Finaya", icon: <TrendingUp className="h-8 w-8" /> },
    { number: "90%", label: "Businesses need automation", icon: <Zap className="h-8 w-8" /> },
    { number: "10M+", label: "Data points analyzed daily", icon: <Brain className="h-8 w-8" /> }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Input Financial Data',
      desc: 'Upload or manually enter your financial data and investment details',
      icon: <Calculator className="w-6 h-6" />
    },
    {
      step: 2,
      title: 'AI Analysis',
      desc: 'Advanced algorithms analyze yield potential and risk factors',
      icon: <Brain className="w-6 h-6" />
    },
    {
      step: 3,
      title: 'Get Strategic Insights',
      desc: 'Receive personalized yield optimization recommendations',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      step: 4,
      title: 'Automate & Optimize',
      desc: 'Deploy automation tools for continuous financial management',
      icon: <Zap className="w-6 h-6" />
    }
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
    { Flag: flags.AU, name: 'Australia' }
  ];

  const testimonials = [
    {
      quote: "Finaya revolutionized my financial management! The AI yield analysis increased my investment returns by 25% and automation handled all compliance reporting.",
      author: "Rahman S., Investment Manager",
      rating: 5,
    },
    {
      quote: "The strategic advisor feature is incredible. It provided personalized recommendations that optimized my portfolio and saved thousands in unnecessary fees.",
      author: "Maya L., Financial Advisor",
      rating: 5,
    },
    {
      quote: "Automating my financial workflows with Finaya freed up 20 hours per week. The yield optimization suggestions have been spot on every time.",
      author: "Andi K., Startup Founder",
      rating: 5,
    },
  ];

  return (
    <main className="overflow-hidden bg-black">
      {/* Hero Section */}
      <section className="min-h-screen relative flex flex-col justify-center items-center px-4 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
        
        <div className="max-w-6xl z-20 text-center relative">
          <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            Financial Automation
            <br />
            <span className="text-yellow-400">Yield Advisor</span>
          </h1>

          <p className="hero-subtitle text-lg sm:text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Intelligent financial automation platform designed for MSMEs that analyzes yield potential and provides strategic financial advice for optimized returns
          </p>
          
          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-8 py-4 font-medium text-lg"
            >
              <BarChart3 className="h-5 w-5" />
              Get Started Free
            </button>
            <a
              href="#features"
              className="rounded-full bg-white text-yellow-600 border border-yellow-600 transition-all duration-300 ease-out transform hover:scale-105 hover:bg-yellow-600 hover:text-white hover:border-white flex items-center justify-center gap-2 px-8 py-4 font-medium text-lg"
            >
              Learn More
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-yellow-400">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    {React.cloneElement(stat.icon, { className: "h-6 w-6 text-yellow-600" })}
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        login={login}
        register={register}
      />

      {/* Stats Problem Section */}
      <section id="problem" className="py-20 px-4 bg-gray-900 border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Financial Challenges Facing MSMEs
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Key financial barriers hindering optimal yield and growth in Asian markets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-yellow-400">
                <div className="text-5xl font-bold mb-4 text-yellow-400">
                  {stat.number}
                </div>
                <p className="text-gray-300 leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful tools designed for modern businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-yellow-400 group">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-yellow-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(feature.icon, { className: "h-8 w-8 text-yellow-600" })}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Simple, Powerful Process
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="step-item text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-8 h-8 text-white">
                      {React.cloneElement(item.icon, { className: "w-full h-full" })}
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white">{item.title}</h4>
                <p className="text-gray-300 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Built for Asia-Pacific
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Supporting businesses across 9 countries and counting
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 max-w-6xl mx-auto">
            {countries.map((country, index) => (
              <div key={index} className="country-card text-center p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="mb-3 flex justify-center items-center h-12">
                  <country.Flag className="w-16 h-12 object-cover rounded shadow-sm group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-sm font-medium text-gray-300">{country.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-white">
            User Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-yellow-400"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="font-semibold text-yellow-400">
                  {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-4 bg-yellow-600">
        <div className="cta-content max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to optimize your financial future?
          </h2>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Join thousands of MSMEs maximizing returns with AI-driven financial automation
          </p>
          <p className="text-sm text-yellow-100 mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>
    </main>
  );
}
