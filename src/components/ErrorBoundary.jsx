import React from 'react';
import PageBackground from './PageBackground';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Uncaught error:", error, errorInfo);
    }
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 sm:p-6 relative overflow-hidden">
          <PageBackground showArt={false} />

          <div className="max-w-lg w-full bg-[#0c0d10] border border-white/10 rounded-[1.75rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-center relative z-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-pixel text-[9px] uppercase tracking-wider mb-4">
              Something went wrong
            </div>
            
            <h1 className="font-pixel text-xl sm:text-2xl text-white tracking-tight uppercase mb-3">
              We ran into an unexpected issue
            </h1>
            
            <p className="text-slate-400 font-sans text-sm sm:text-base leading-relaxed mb-8">
              An error occurred while loading this page. Your auction rooms and saved data are safe. Try reloading or heading back to the home page.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1 py-3.5 px-6 bg-white text-black hover:bg-slate-200 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 active:scale-[0.98] shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="w-full sm:flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 active:scale-[0.98]"
              >
                Return to Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left border-t border-white/10 pt-6">
                <details className="group">
                  <summary className="text-[11px] font-mono text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors list-none flex items-center gap-2 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-open:bg-white" />
                    Technical details
                  </summary>
                  <div className="mt-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl overflow-auto max-h-48 scrollbar-hide">
                    <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
