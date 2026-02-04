import React from "react";
import { SafeAreaView, StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../app/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg },
  container: { flex: 1, padding: theme.space.lg, gap: theme.space.md },
  card: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space.lg,
  },
});
