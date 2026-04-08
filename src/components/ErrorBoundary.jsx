import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NEXUS ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#050510',
          color: '#ff2d55',
          fontFamily: "'JetBrains Mono', monospace",
          minHeight: '100vh',
        }}>
          <h2 style={{ color: '#ff2d55', marginBottom: '16px' }}>
            ⚠ NEXUS — Component Error
          </h2>
          <div style={{
            background: 'rgba(255,45,85,0.1)',
            border: '1px solid rgba(255,45,85,0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ color: '#fff', fontSize: '14px' }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
          </div>
          <pre style={{
            background: 'rgba(10,10,30,0.8)',
            border: '1px solid #1a1a2e',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            overflow: 'auto',
            maxHeight: '300px',
          }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: 'rgba(57,255,143,0.1)',
              border: '1px solid rgba(57,255,143,0.5)',
              borderRadius: '8px',
              color: '#39ff8f',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ↺ Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
