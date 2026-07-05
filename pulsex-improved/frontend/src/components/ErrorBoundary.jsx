import { Component } from "react";
import { AlertOctagon, RotateCcw, HeartPulse } from "lucide-react";
import { Button } from "./ui";

// Catches render-time crashes anywhere below it in the tree and shows a calm,
// on-brand recovery screen instead of the blank white page React would
// otherwise leave behind. This matters most during a live demo: one bad prop
// or an unexpected null in a single widget should never take down the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In a real deployment this would forward to an error-tracking service.
    console.error("PulseX AI — unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="relative w-full max-w-md text-center glass border border-line rounded-2xl px-8 py-12 shadow-premium">
          <div className="flex items-center gap-2 justify-center mb-8">
            <HeartPulse className="text-pulse" size={20} strokeWidth={2.5} />
            <span className="font-display font-semibold text-lg">PulseX AI</span>
          </div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-pulse/10 border border-pulse/30 flex items-center justify-center">
            <AlertOctagon className="text-pulse" size={28} strokeWidth={1.5} />
          </div>
          <div className="font-mono text-xs text-mist tracking-widest uppercase mb-2">Unexpected error</div>
          <h1 className="font-display text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-mist text-sm mb-8 leading-relaxed">
            This screen hit an unexpected error. Your data is safe — nothing was lost. Returning to the home
            screen usually resolves it.
          </p>
          <Button className="w-full group" onClick={this.handleReset}>
            <RotateCcw size={15} className="transition-transform group-hover:-rotate-45" />
            Reload PulseX AI
          </Button>
        </div>
      </div>
    );
  }
}
