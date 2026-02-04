import React from "react";
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from "react-native";
import { theme } from "../app/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  leftIcon,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          leftIcon ?? null
        )}
        <Text
          style={[
            styles.text,
            variant === "secondary" && styles.textSecondary,
            variant === "ghost" && styles.textGhost,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.space.lg,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  primary: { backgroundColor: theme.color.primary },
  secondary: {
    backgroundColor: theme.color.card2,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  ghost: { backgroundColor: "transparent" },
  text: { color: "#fff", fontSize: 16, fontWeight: "800" },
  textSecondary: { color: theme.color.text },
  textGhost: { color: theme.color.primary },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.99 }] },
});
