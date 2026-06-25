"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to your monitoring — don't throw
    console.error(
      `[TSP] Section "${this.props.sectionName}" crashed:`,
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      // Render NOTHING visually — don't show ugly error UI on prod
      // But keep the section's background div so layout doesn't break
      return (
        <div
          className="min-h-[200px]"
          data-section-error={this.props.sectionName}
        />
      );
    }
    return this.props.children;
  }
}
