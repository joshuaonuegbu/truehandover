import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppErrorBoundaryState {
    hasError: boolean;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Unhandled frontend error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="min-h-screen w-full bg-[#0f0f15] text-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
                    <p className="text-sm text-slate-300 mb-6">
                        An unexpected error has occurred. You can dismiss the error and try to continue, or reload the page to fully reset the application.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={this.handleRetry}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                        >
                            Dismiss Error
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-brand text-black hover:bg-brand-hover transition-colors inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AppErrorBoundary;
