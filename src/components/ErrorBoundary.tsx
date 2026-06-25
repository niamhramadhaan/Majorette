import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

export default function ErrorBoundary({ children, fallbackTitle }: Props) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setError(event.error || new Error(event.message));
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-sm p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-heading font-bold text-white mb-2">
            {fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">{error.message}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setError(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
              Try Again
            </button>
            <button onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
