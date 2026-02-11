import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  name?: string; // Optional name to identify which boundary caught the error
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

function ErrorBoundaryContent({
  error,
  errorInfo,
  name,
  onReset,
  onReload,
}: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  name?: string;
  onReset: () => void;
  onReload: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <h2>{t('error.somethingWrong')}</h2>
        {name && (
          <p className="error-location">{t('error.errorIn')} <strong>{name}</strong></p>
        )}

        <div className="error-details">
          <p className="error-message">
            {error?.message || 'Unknown error'}
          </p>

          <details className="error-stack">
            <summary>{t('error.technicalDetails')}</summary>
            <pre>{error?.stack}</pre>
            {errorInfo && (
              <>
                <p><strong>Component Stack:</strong></p>
                <pre>{errorInfo.componentStack}</pre>
              </>
            )}
          </details>
        </div>

        <div className="error-boundary-actions">
          <button className="primary-button" onClick={onReset}>
            {t('error.tryAgain')}
          </button>
          <button className="secondary-button" onClick={onReload}>
            {t('error.reloadPage')}
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary${this.props.name ? ` [${this.props.name}]` : ''} caught an error:`, error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          name={this.props.name}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
