import React from 'react';
import i18next from 'i18next';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort guard against render crashes (previously any uncaught render
 * error meant a white screen — it happened twice in spectator mode).
 * The active game is auto-saved to localStorage on every change, so a reload
 * recovers it via RecoverScreen.
 *
 * Class component: React error boundaries have no hook equivalent, hence
 * i18next.t directly instead of useTranslation.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Render crash:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="felt-bg min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl" aria-hidden="true">
          🃏
        </span>
        <h1 className="text-white text-xl font-semibold font-sans">{i18next.t('error.crashTitle')}</h1>
        <p className="text-white/50 text-sm max-w-xs">{i18next.t('error.crashHint')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold
            transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
        >
          {i18next.t('error.crashReload')}
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
