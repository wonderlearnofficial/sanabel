import React from "react";

type State = { failed: boolean };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Keep the error diagnosable without logging tokens, form data or other
    // application state.
    console.error("CLIENT_RENDER_ERROR", {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <main
        className="app-viewport flex items-center justify-center bg-white p-5 text-center"
        role="alert"
      >
        <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-red-50 p-6 text-slate-800 shadow-sm">
          <div className="mb-3 text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="mb-2 text-xl font-bold">تعذر عرض هذه الشاشة</h1>
          <p className="mb-1 text-sm">The application could not display this screen.</p>
          <p className="mb-5 text-xs font-semibold text-red-700" dir="ltr">
            Error code: CLIENT_RENDER_ERROR
          </p>
          <button
            type="button"
            className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة / Retry
          </button>
        </div>
      </main>
    );
  }
}
