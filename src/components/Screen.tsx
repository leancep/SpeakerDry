import React from "react";
import { StyleSheet, View, ViewProps, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../app/theme";

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = false }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: theme.space.lg + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={[styles.container, { paddingBottom: theme.space.lg + insets.bottom }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg },

  // No-scroll
  container: { flex: 1, padding: theme.space.lg, gap: theme.space.md },

  // Scroll
  scrollContent: {
    padding: theme.space.lg,
    gap: theme.space.md,
  },

  card: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space.lg,
  },
});
