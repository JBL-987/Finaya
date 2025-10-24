import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import {
  MapPin,
  BarChart3,
  Brain,
  Target,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  Star,
  Calculator,
  Shield,
  Globe,
  Check,
  X
} from "lucide-react";

export default function Home({ login, register }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const countriesRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const credentials = {
      username: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const result = await login(credentials);
      if (!result.success) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: result.error || "An error occurred during login. Please try again.",
        });
      }
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "An error occurred during login. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const result = await register(userData);
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful",
          text: "Please login with your new account.",
        });
        setIsLoginMode(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: result.error || "An error occurred during registration. Please try again.",
        });
      }
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Data Features
  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Location Intelligence',
      description: 'AI-powered profitability analysis for any location across Asia-Pacific',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Financial Management',
      description: 'Track expenses, forecast revenue, and manage cash flow in real-time',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Regional Insights',
      description: 'Compare performance with benchmarks across APAC markets',
    }
  ];

  const stats = [
    { number: "80%", label: "MSMEs fail within 5 years", icon: <Target className="h-8 w-8" /> },
    { number: "70M", label: "MSMEs in Asia-Pacific", icon: <Users className="h-8 w-8" /> },
    { number: "50%", label: "Lack business analytics", icon: <Brain className="h-8 w-8" /> },
    { number: "2.6T", label: "USD credit gap", icon: <Calculator className="h-8 w-8" /> }
  ];

  const howItWorks = [
    { 
      step: 1, 
      title: 'Select Location', 
      desc: 'Click on map to choose your business location',
      icon: <MapPin className="w-6 h-6" />
    },
    { 
      step: 2, 
      title: 'AI Analysis', 
      desc: 'Computer vision analyzes area distribution and demographics',
      icon: <BarChart3 className="w-6 h-6" />
    },
    { 
      step: 3, 
      title: 'Get Insights', 
      desc: 'Receive profitability score and revenue projections',
      icon: <Zap className="w-6 h-6" />
    },
    { 
      step: 4, 
      title: 'Manage Finances', 
      desc: 'Track actual vs projected performance in real-time',
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const countries = [
    { flag: '🇮🇩', name: 'Indonesia' },
    { flag: '🇹🇭', name: 'Thailand' },
    { flag: '🇻🇳', name: 'Vietnam' },
    { flag: '🇵🇭', name: 'Philippines' },
    { flag: '🇲🇾', name: 'Malaysia' },
    { flag: '🇸🇬', name: 'Singapore' },
    { flag: '🇯🇵', name: 'Japan' },
    { flag: '🇰🇷', name: 'South Korea' },
    { flag: '🇦🇺', name: 'Australia' }
  ];

  const testimonials = [
    {
      quote: "Finaya helped me analyze several different locations. This platform is very accurate in predicting business potential!",
      author: "Budi S., Grocery Store Owner",
      rating: 5,
    },
    {
      quote: "The AI analysis is very detailed. I can see how many potential customers per day before opening a business. Very helpful!",
      author: "Sari L., Restaurant Owner",
      rating: 5,
    },
    {
      quote: "This platform saves time and location research costs. In 5 minutes I already know the business potential of my location.",
      author: "Andi K., Cafe Owner",
      rating: 5,
    },
  ];

  return (
    <main className="overflow-hidden bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen relative flex flex-col justify-center items-center px-4 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-white z-0"></div>
        
        <div className="max-w-6xl z-20 text-center relative">
          <div className="mb-8">
          </div>
          
          <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight">
            Financial Intelligence
            <br />
            <span className="text-yellow-600">for Asia-Pacific</span>
          </h1>
          
          <p className="hero-subtitle text-lg sm:text-xl md:text-2xl mb-8 text-gray-600 max-w-4xl mx-auto leading-relaxed">
            AI-powered location analysis and financial management platform for MSMEs across Asia-Pacific
          </p>
          
          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-8 py-4 font-medium shadow-lg hover:shadow-xl text-lg"
            >
              <BarChart3 className="h-5 w-5" />
              Get Started Free
            </button>
            <a 
              href="#features"
              className="rounded-full bg-white text-yellow-600 border border-yellow-600 transition-all duration-300 ease-out transform hover:scale-105 hover:bg-yellow-600 hover:text-white hover:border-white flex items-center justify-center gap-2 px-8 py-4 font-medium shadow-lg hover:shadow-xl text-lg"
            >
              Learn More
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    {React.cloneElement(stat.icon, { className: "h-6 w-6 text-yellow-600" })}
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 py-3 px-4 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Create Account')}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {isLoginMode ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Problem Section */}
      <section id="problem" ref={statsRef} className="py-20 px-4 bg-gray-50 border-y">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              MSMEs Need Better Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Critical barriers preventing business growth across Asia-Pacific
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold mb-4 text-yellow-600">
                  {stat.number}
                </div>
                <p className="text-gray-600 leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed for modern businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-yellow-300 group">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-yellow-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(feature.icon, { className: "h-8 w-8 text-yellow-600" })}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Simple, Powerful Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="step-item text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-8 h-8 text-white">
                      {React.cloneElement(item.icon, { className: "w-full h-full" })}
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-gray-900">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" ref={countriesRef} className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Built for Asia-Pacific
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supporting businesses across 9 countries and counting
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 max-w-6xl mx-auto">
            {countries.map((country, index) => (
              <div key={index} className="country-card text-center p-4 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{country.flag}</div>
                <div className="text-sm font-medium text-gray-700">{country.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialsRef} className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-900">
            User Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="font-semibold text-yellow-600">
                  {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" ref={ctaRef} className="py-20 px-4 bg-yellow-600">
        <div className="cta-content max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Join thousands of MSMEs making data-driven decisions across Asia-Pacific
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-full bg-white text-yellow-600 border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-yellow-600 hover:text-white hover:border-white flex items-center justify-center gap-2 px-8 py-4 font-bold shadow-2xl hover:shadow-3xl text-lg mx-auto"
          >
            <TrendingUp className="h-5 w-5" />
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-sm text-yellow-100 mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>
    </main>
  );
}