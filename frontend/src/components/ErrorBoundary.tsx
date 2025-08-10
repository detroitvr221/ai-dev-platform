import React from 'react';

type Props = { children: React.ReactNode; label?: string };
type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: 'ui-sans-serif', color: '#ef4444' }}>
          <div style={{ fontWeight: 600 }}>UI crashed{this.props.label ? ` in ${this.props.label}` : ''}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      );
    }
    return this.props.children as any;
  }
}


