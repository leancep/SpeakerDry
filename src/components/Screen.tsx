import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../app/theme";

export function Screen({
  children,
  scroll = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  container: {
    flex: 1,
    padding: theme.space.lg,
    backgroundColor: theme.color.bg,
    gap: 14,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  scrollContent: {
    flexGrow: 1, // 🔥 clave: rellena el alto y evita “gris” abajo
    padding: theme.space.lg,
    backgroundColor: theme.color.bg,
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.color.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
});
