"use client";

import { Component, type ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasFailed: boolean };

export class SceneBoundary extends Component<Props, State> {
  state: State = { hasFailed: false };

  static getDerivedStateFromError(): State {
    return { hasFailed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(
      "The 3D scene could not start:",
      error instanceof Error ? error.message : error,
    );
  }

  render() {
    return this.state.hasFailed ? this.props.fallback : this.props.children;
  }
}
