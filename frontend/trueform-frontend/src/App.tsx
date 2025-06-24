import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useActiveTab, useTheme } from './contexts/AppContext';
import { Layout } from './components/layout/Layout';
import { EditorPage } from './pages/EditorPage';
import { LibraryPage } from './pages/LibraryPage';
import { ExecutionsPage } from './pages/ExecutionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 404s
        if (error?.response?.status === 404) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});

// Main App Content Component
const AppContent: React.FC = () => {
  const { activeTab } = useActiveTab();
  const { theme } = useTheme();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + 1-4 for tab switching
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'editor' }));
            break;
          case '2':
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'library' }));
            break;
          case '3':
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'executions' }));
            break;
          case '4':
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'analytics' }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load example forms from public directory
  useEffect(() => {
    const loadExampleForms = async () => {
      try {
        // Try to load example forms for demo purposes
        const response = await fetch('/data/example-decision-workflow.form');
        if (response.ok) {
          const exampleForm = await response.json();
          console.log('Loaded example form:', exampleForm.metadata.name);
        }
      } catch (error) {
        console.log('No example forms found, starting fresh');
      }
    };

    loadExampleForms();
  }, []);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorPage />;
      case 'library':
        return <LibraryPage />;
      case 'executions':
        return <ExecutionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <EditorPage />;
    }
  };

  return (
    <Layout>
      {renderCurrentPage()}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </Layout>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="text-6xl">💥</div>
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
