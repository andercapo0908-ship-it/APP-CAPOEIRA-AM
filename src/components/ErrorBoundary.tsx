import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Erro de Permissão: Não foi possível realizar a operação de ${parsed.operationType} em ${parsed.path}.`;
          } else {
            errorMessage = this.state.error.message;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-premium-black flex items-center justify-center p-4 text-center">
          <div className="bg-zinc-900 border border-incendeia-red/30 p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl font-black-ops text-incendeia-red mb-4">OPS! ALGO DEU ERRADO</h2>
            <p className="text-zinc-400 mb-6 text-sm">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-incendeia-red text-white font-black-ops rounded-lg hover:bg-red-700 transition-colors"
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
