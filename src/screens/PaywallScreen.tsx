import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import { useEntitlements } from "../pro/EntitlementsProvider";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export default function PaywallScreen({ navigation }: Props) {
  const ent = useEntitlements();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock PRO Cleaning</Text>
        <Text style={styles.subtitle}>Stronger vibration, deeper cleaning, and no ads.</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>What you get</Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          <Text style={styles.item}>✅ Deep Clean mode (2 min)</Text>
          <Text style={styles.item}>✅ Full frequency range (200–3000 Hz)</Text>
          <Text style={styles.item}>✅ Ad-free experience</Text>
        </View>

        <View style={{ height: 16 }} />
        <View style={styles.priceRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Monthly Plan</Text>
          </View>
          <Text style={styles.priceText}>{ent.proLabel}</Text>
        </View>

        <View style={{ height: 14 }} />

        {ent.isPro ? (
          <PrimaryButton label="✅ PRO active" onPress={() => navigation.goBack()} />
        ) : (
          <>
            <PrimaryButton label="💎 Start PRO" onPress={ent.buyPro} />
            <View style={{ height: 10 }} />
            <PrimaryButton label="Restore purchase" variant="secondary" onPress={ent.restore} />
          </>
        )}
      </Card>

      <PrimaryButton label="No thanks" variant="ghost" onPress={() => navigation.goBack()} />

      <Text style={styles.legal}>
        Cancel anytime. Purchases are managed in Google Play.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginTop: 6 },
  title: { fontSize: 28, fontWeight: "900", color: theme.color.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: theme.color.text },
  item: { color: theme.color.muted },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.color.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(31,111,235,0.35)",
  },
  badgeText: { color: theme.color.primary, fontWeight: "900", fontSize: 12 },
  priceText: { color: theme.color.muted },
  legal: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 2 },
});
