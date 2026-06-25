import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/app';
import { saveUserName } from '../lib/storage';
import { hexToRgba, getThemeColor } from '../lib/utils';
import { LightRays } from '../components/ui/light-rays';

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      saveUserName(trimmed);
      setIsLoading(false);
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4] relative overflow-hidden">
      <LightRays
        color={hexToRgba(getThemeColor('--color-primary'), 0.25)}
        count={8}
        blur={40}
        speed={12}
        length="80vh"
      />

      <div className="w-full max-w-md card p-8 sm:p-10 relative z-10 shadow-2xl shadow-primary/5 bg-white/90 backdrop-blur-xl border border-white/50">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg shadow-primary/20 ring-4 ring-white bg-primary flex items-center justify-center">
            <img src="/logo.png" alt="JEMIMA" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Welcome to {APP_CONFIG.name}
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide uppercase">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?" 
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-70 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 disabled:hover:shadow-none"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin"></span>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
