import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTab?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BidX Component Error Boundary Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.fallbackTab) {
      this.props.fallbackTab();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-3xl glass-card border border-red-500/30 text-center space-y-4 shadow-2xl animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F0F0F0] mb-1">View Loading Notice</h3>
            <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering issue occurred in this section.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl neon-bg-orange text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry View</span>
            </button>
            {this.props.fallbackTab && (
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
