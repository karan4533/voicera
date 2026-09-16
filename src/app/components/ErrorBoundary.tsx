import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { safeLog } from "../lib/safeLog";

interface Props {
  children: ReactNode;
  /** Optional label for logs (e.g. "dashboard-routes") */
  name?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

/** Catches render crashes so one bad page does not blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unexpected error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    safeLog.warn(`ErrorBoundary${this.props.name ? ` (${this.props.name})` : ""}`, {
      error,
      componentStack: info.componentStack,
    });
  }

  private reset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6" role="alert">
        <div className="vo-card max-w-md w-full p-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FEE2E2]">
            <AlertTriangle size={22} className="text-[#DC2626]" aria-hidden />
          </div>
          <h2 className="m-0 mb-2 text-[16px] font-bold text-[#1E1A14]">Something went wrong</h2>
          <p className="m-0 mb-4 text-[13px] text-[#7A746C] leading-relaxed">
            This screen hit an unexpected error. You can try again or go back to the dashboard.
          </p>
          <p className="m-0 mb-5 text-[11px] font-mono text-[#9E9890] break-all">{this.state.message}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="h-9 px-4 rounded-lg border-none bg-[#50381F] text-[13px] font-semibold text-white cursor-pointer hover:bg-[#3D2914]"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="inline-flex h-9 items-center px-4 rounded-lg border border-[#E2DDD5] bg-white text-[13px] font-semibold text-[#50381F] no-underline hover:bg-[#F7F4EF]"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
