"use client";

import { Component, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";

interface Props {
  widgetLabel: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Aislamiento de fallos por widget (Prompt 12: "si un widget falla, los
 * demas siguen funcionando"). Los Error Boundaries de React solo existen
 * como class components - no hay equivalente en hooks.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[Mission Control] El widget "${this.props.widgetLabel}" falló:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={`"${this.props.widgetLabel}" no pudo cargarse`}
          actionLabel="Reintentar"
          onAction={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
