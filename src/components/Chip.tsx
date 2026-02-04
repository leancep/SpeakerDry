import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../app/theme";

export default function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.txt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.color.card2,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  txt: { color: theme.color.muted, fontSize: 12, fontWeight: "700" },
});
