import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { firebaseAuth } from '../services/firebase';
import { safeRedirect } from '../utils/security';

const AuthModal = ({ isOpen, onClose, login, register }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '', fullName: '' });
      setIsLoginMode(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const result = await login({ email: formData.email, password: formData.password });
        
        if (result.success) {
          onClose();
          safeRedirect('/app');
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.error || 'Login failed',
            background: '#171717',
            color: '#ffffff',
            confirmButtonColor: '#eab308'
          });
        }
      } else {
        const result = await register({ 
          email: formData.email, 
          password: formData.password, 
          fullName: formData.fullName 
        });
        
        if (result.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: 'Welcome to Finaya. Please login.',
            background: '#171717',
            color: '#ffffff',
            confirmButtonColor: '#eab308'
          });
          setIsLoginMode(true);
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: result.error || 'Registration failed',
            background: '#171717',
            color: '#ffffff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    } catch (error) {
      console.error('AuthModal error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        background: '#171717',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { user, idToken } = await firebaseAuth.signInWithGoogle();
      const result = await login({ email: user.email, firebaseToken: idToken });
      
      if (result.success) {
        onClose();
        setTimeout(() => { safeRedirect('/app'); }, 100);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (error.code === 'auth/user-cancelled' || error.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      await Swal.fire({
        icon: 'error',
        title: 'Authentication Error',
        text: error.message || 'Google Sign-In Failed',
        background: '#171717',
        color: '#ffffff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl shadow-yellow-500/10 transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Decorative Gradient Blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 sm:p-10 relative z-0">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isLoginMode ? 'Welcome Back' : 'Join Finaya'}
            </h2>
            <p className="text-neutral-400 text-sm">
              {isLoginMode 
                ? 'Enter your details to access your workspace' 
                : 'Start your intelligent location analysis journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                    className="w-full bg-neutral-900/50 border border-neutral-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-neutral-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLoginMode ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-neutral-950 px-3 text-neutral-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-neutral-400">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-yellow-500 hover:text-yellow-400 font-medium hover:underline transition-all"
            >
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
