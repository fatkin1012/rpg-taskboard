import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches render crashes and shows a graceful fallback
 * instead of blanking the entire overlay.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed z-[9999] bg-pixel-bg/95 border border-pixel-accent rounded-lg shadow-lg"
          style={{
            width: '250px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="p-4 text-center">
            <div className="text-xl mb-2">⚠️</div>
            <p className="text-[9px] text-pixel-accent font-pixel mb-1">RPG Taskboard</p>
            <p className="text-[8px] text-pixel-dim font-pixel mb-3">
              Something went wrong
            </p>
            <button
              onClick={this.handleReset}
              className="px-3 py-1 text-[8px] font-pixel text-pixel-text border border-pixel-border rounded hover:bg-pixel-panel/50"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
