import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../app/theme";

export default function ProBadge({
  text = "PRO",
  variant = "pro",
}: {
  text?: string;
  variant?: "pro" | "active";
}) {
  const active = variant === "active";

  return (
    <View style={[styles.badge, active && styles.active]}>
      <Text style={[styles.txt, active && styles.txtActive]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.color.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(31,111,235,0.35)",
  },
  txt: { color: theme.color.primary, fontSize: 11, fontWeight: "900" },

  active: {
    backgroundColor: "rgba(34,197,94,0.16)",
    borderColor: "rgba(34,197,94,0.35)",
  },
  txtActive: { color: theme.color.success },
});
