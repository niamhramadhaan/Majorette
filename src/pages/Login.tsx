import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/app';
import { saveUserName } from '../lib/storage';

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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4] border-none relative overflow-hidden">
      
      <style>
        {`
          @keyframes wave-animation {
            0% { transform: translateX(0) translateZ(0) scaleY(1); }
            50% { transform: translateX(-25%) translateZ(0) scaleY(0.9); }
            100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
          }
          .wave-bg {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 200%;
            height: 100%;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230E7B35' fill-opacity='0.08' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
            background-size: 50% 100%;
            background-repeat: repeat-x;
            background-position: bottom;
            animation: wave-animation 15s infinite linear;
          }
          .wave-bg-2 {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 200%;
            height: 100%;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230E7B35' fill-opacity='0.05' d='M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
            background-size: 50% 100%;
            background-repeat: repeat-x;
            background-position: bottom;
            animation: wave-animation 20s infinite linear reverse;
          }
        `}
      </style>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="wave-bg-2"></div>
        <div className="wave-bg"></div>
      </div>

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
