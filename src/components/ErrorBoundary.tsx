import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development, could send to error tracking service in production
        if (!import.meta.env.PROD) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8">
                    <div className="flex flex-col items-center text-center max-w-sm">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-8">
                            <span className="text-2xl">!</span>
                        </div>

                        <h1 className="text-xl text-foreground font-medium mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-brief-text-secondary mb-8">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        <Button
                            variant="brief"
                            onClick={this.handleReload}
                            className="w-full"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
