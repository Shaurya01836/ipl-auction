import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
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
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

          <div className="max-w-md w-full glass-premium border-red-500/20 rounded-[2.5rem] p-10 text-center relative z-10">
            <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/20">
              <svg className="w-12 h-12 text-red-500 animate-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">
              Arena <span className="text-red-500">Fault</span>
            </h1>
            
            <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 uppercase tracking-widest opacity-70">
              The auction engine encountered a critical disruption. We've gated the session to prevent data corruption.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-5 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-red-600/20"
              >
                Re-Ignite Engine
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-5 px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-gray-400 hover:text-white"
              >
                Return to Base
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-10 text-left">
                <details className="group">
                  <summary className="text-[10px] font-black text-gray-700 uppercase tracking-widest cursor-pointer hover:text-red-500/50 transition-colors list-none flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/30 group-open:bg-red-500" />
                    Fault Diagnostics
                  </summary>
                  <div className="mt-4 p-5 bg-black/40 border border-white/5 rounded-2xl overflow-auto max-h-48 scrollbar-hide">
                    <div className="text-[10px] font-mono text-red-400/70 whitespace-pre-wrap leading-relaxed">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
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
