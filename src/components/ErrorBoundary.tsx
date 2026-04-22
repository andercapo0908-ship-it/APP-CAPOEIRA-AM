import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
          <div className="bg-zinc-900 border border-red-600/30 p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">OPS! ALGO DEU ERRADO</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              {this.state.error?.message || "Erro inesperado no app."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              RECARREGAR APP
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}