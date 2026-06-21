import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Play, Film, Music, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_CONFIG } from '../config/app';
import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_VENUE, SAMPLE_CONTENT, SAMPLE_SCHEDULE, generateId, getTimestamp, addActivity } from '../lib/storage';
import type { Venue, AppSettings } from '../types';

const STEPS = [
  { id: 1, title: 'Welcome', subtitle: 'Get started with JEMIMA' },
  { id: 2, title: 'Your Venue', subtitle: 'Name your space' },
  { id: 3, title: 'Ready!', subtitle: 'Start playing content' },
];

export default function QuickStart() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [venueName, setVenueName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleNext = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleFinish = () => {
    setIsCreating(true);

    const venue: Venue = { ...DEFAULT_VENUE, id: generateId(), name: venueName || 'My Venue', createdAt: getTimestamp() };
    const schedule = { ...SAMPLE_SCHEDULE, id: generateId(), locationId: venue.id, createdAt: getTimestamp(), updatedAt: getTimestamp() };
    const settings: AppSettings = { ...DEFAULT_SETTINGS, setupComplete: true, venueName: venue.name };

    localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(SAMPLE_CONTENT));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([schedule]));
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify([venue]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    addActivity({ message: 'Setup complete! Welcome to ' + venue.name, type: 'success' });
    setIsCreating(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4] relative overflow-hidden">
      <style>{`
        @keyframes wave-animation { 0% { transform: translateX(0) scaleY(1); } 50% { transform: translateX(-25%) scaleY(0.9); } 100% { transform: translateX(-50%) scaleY(1); } }
        .wave-bg { position: absolute; bottom: 0; left: 0; width: 200%; height: 100%; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230E7B35' fill-opacity='0.08' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"); background-size: 50% 100%; background-repeat: repeat-x; animation: wave-animation 15s infinite linear; }
        .wave-bg-2 { position: absolute; bottom: 0; left: 0; width: 200%; height: 100%; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230E7B35' fill-opacity='0.05' d='M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"); background-size: 50% 100%; background-repeat: repeat-x; animation: wave-animation 20s infinite linear reverse; }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden"><div className="wave-bg-2"></div><div className="wave-bg"></div></div>

      <div className="w-full max-w-2xl card p-8 sm:p-10 relative z-10 shadow-2xl shadow-[#0E7B35]/5 bg-white/90 backdrop-blur-xl border border-white/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg shadow-[#0E7B35]/20 ring-4 ring-white bg-[#0E7B35] flex items-center justify-center">
            <img src="/logo.png" alt="JEMIMA" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">{STEPS[currentStep - 1].title}</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">{STEPS[currentStep - 1].subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors", currentStep > i + 1 ? "bg-[#0E7B35] text-white" : currentStep === i + 1 ? "bg-[#0E7B35] text-white" : "bg-gray-200 text-gray-500")}>
                {currentStep > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-1 rounded-full", currentStep > i + 1 ? "bg-[#0E7B35]" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        <div className="min-h-[200px]">
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-heading font-semibold text-gray-900">Welcome to {APP_CONFIG.name}</h3>
              <p className="text-gray-600">Set up your digital signage in seconds. Add your media files to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{APP_CONFIG.contentRoot}</code> and manage them from here.</p>
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="p-4 bg-gray-50 rounded-xl"><Film className="w-8 h-8 text-[#0E7B35] mx-auto mb-2" /><p className="text-sm font-medium text-gray-700">Video</p></div>
                <div className="p-4 bg-gray-50 rounded-xl"><Music className="w-8 h-8 text-[#0E7B35] mx-auto mb-2" /><p className="text-sm font-medium text-gray-700">Audio</p></div>
                <div className="p-4 bg-gray-50 rounded-xl"><ImageIcon className="w-8 h-8 text-[#0E7B35] mx-auto mb-2" /><p className="text-sm font-medium text-gray-700">Images</p></div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Venue Name</label>
                <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. My Cafe, Studio A, Lobby Display"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35]" />
                <p className="text-xs text-gray-500 mt-2">This will appear on your dashboard and player.</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><Check className="w-10 h-10 text-[#0E7B35]" /></div>
              <h3 className="text-xl font-heading font-semibold text-gray-900">You're All Set!</h3>
              <p className="text-gray-600">Sample content and schedule have been created. Add your own media files to get started.</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Content Folder</p>
                <p className="text-xs font-mono text-gray-600 mt-2">{APP_CONFIG.contentRoot}</p>
                <p className="text-xs text-gray-400 mt-2">Supported: mp4, webm, mp3, wav, jpg, png, webp</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/60">
          {currentStep > 1 ? (
            <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
          ) : <div />}
          {currentStep < 3 ? (
            <button onClick={handleNext} disabled={currentStep === 2 && !venueName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0E7B35] hover:bg-[#0A5E28] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-md">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={isCreating}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0E7B35] hover:bg-[#0A5E28] disabled:opacity-70 text-white rounded-lg text-sm font-semibold transition-colors shadow-md">
              {isCreating ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Play className="w-4 h-4" />}
              {isCreating ? 'Setting up...' : 'Go to Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
