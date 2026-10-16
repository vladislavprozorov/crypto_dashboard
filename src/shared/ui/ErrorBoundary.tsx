import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-20">
        <h1 className="m-0 text-xl font-semibold">Что-то сломалось</h1>
        <p className="num m-0 text-sm text-muted">{this.state.error.message}</p>
        <button type="button" className="btn" onClick={() => location.reload()}>
          Перезагрузить
        </button>
      </div>
    );
  }
}
