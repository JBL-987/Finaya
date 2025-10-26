import React, { useState } from 'react';
import { X } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, login, register }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        console.log('Attempting login in AuthModal');
        const result = await login({ email: formData.email, password: formData.password });
        console.log('Login result:', result);
        
        if (result.success) {
          console.log('Login successful, redirecting to /app');
          onClose();
          window.location.href = '/app';
        } else {
          alert(result.error || 'Login failed');
        }
      } else {
        console.log('Attempting registration in AuthModal');
        const result = await register({ 
          email: formData.email, 
          password: formData.password, 
          fullName: formData.fullName 
        });
        console.log('Registration result:', result);
        
        if (result.success) {
          alert('Registration successful! Please login.');
          setIsLoginMode(true);
        } else {
          alert(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('AuthModal error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-gray-800 text-white placeholder-gray-400"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-gray-800 text-white placeholder-gray-400"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-gray-800 text-white placeholder-gray-400"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 py-3 px-4 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="px-4 py-3 border border-gray-600 rounded-lg font-semibold text-gray-300 hover:bg-gray-800 transition-all"
            >
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
