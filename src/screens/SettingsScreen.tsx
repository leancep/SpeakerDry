import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import PrimaryButton from "../components/PrimaryButton";
import ProBadge from "../components/ProBadge";
import { useEntitlements } from "../pro/EntitlementsProvider";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const ent = useEntitlements();

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <Text style={styles.subtitle}>Info, PRO status, and utilities.</Text>
      </View>

      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.h}>Status</Text>
          {ent.isPro ? (
            <ProBadge text="PRO" variant="active" />
          ) : (
            <ProBadge text="FREE" variant="pro" />
          )}
        </View>

        <Text style={styles.p}>
          {ent.isPro
            ? "PRO is enabled. Deep Clean and the full frequency range are available."
            : "You’re on FREE. Deep Clean and advanced frequencies unlock with PRO."}
        </Text>

        <PrimaryButton
          label={ent.isPro ? "View PRO benefits" : "Unlock PRO"}
          variant="secondary"
          onPress={() => navigation.navigate("Paywall", { source: "home" })}
        />

        <PrimaryButton label="🔄 Refresh status" variant="ghost" onPress={() => ent.refresh()} />
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={styles.h}>About</Text>
        <Text style={styles.p}>SpeakerDry · Speaker cleaner with sound waves.</Text>
        <Text style={styles.pSmall}>Version: 0.1.0</Text>
      </Card>

      {__DEV__ && (
        <Card style={{ gap: 10 }}>
          <Text style={styles.h}>Dev tools</Text>

          <PrimaryButton
            label={ent.isPro ? "✅ PRO active (tap to disable)" : "🔓 Enable PRO (DEV)"}
            variant="secondary"
            onPress={() => ent.setProDebug(!ent.isPro)}
          />

          <Text style={styles.pSmall}>Dev-only. Persists on the device.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontSize: 16, fontWeight: "900", color: theme.color.text },
  p: { color: theme.color.muted, lineHeight: 18 },
  pSmall: { color: theme.color.muted, fontSize: 12 },
});
