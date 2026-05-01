import React from "react";
import { View, Text } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    // could log to diagnostics
    console.error("ErrorBoundary caught", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex:1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: terminalColors.red, fontFamily: terminalFont, fontSize: 16 }}>Something went wrong.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
