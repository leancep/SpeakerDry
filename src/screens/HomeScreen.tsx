import React from "react";
import { Text, StyleSheet, View, ScrollView, Animated, Easing } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import PrimaryButton from "../components/PrimaryButton";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import Chip from "../components/Chip";
import { useEntitlements } from "../pro/EntitlementsProvider";
import ProBadge from "../components/ProBadge";
import * as Haptics from "expo-haptics";


type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const ent = useEntitlements();

  const lastHapticAtRef = React.useRef(0);

  async function lockedFeedback() {
    const now = Date.now();
    if (now - lastHapticAtRef.current < 600) return;
    lastHapticAtRef.current = now;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
  }

  const proAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (ent.isPro) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(proAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(proAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [ent.isPro, proAnim]);

  const proScale = proAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <Screen scroll>
      {/* HERO */}
      <Card style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 22 }}>🔊</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 22, fontWeight: "900", color: theme.color.text }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              SpeakerDry
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text style={styles.heroSub}>
                {ent.isPro ? "PRO unlocked · no limits" : "Speaker cleaner with sound waves"}
              </Text>

              {ent.isPro ? (
                <ProBadge text="PRO" variant="active" />
              ) : (
                <ProBadge text="FREE" variant="pro" />
              )}
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12 }}
        >
          <Chip text="No sign-up" />
          <Chip text="Manual Hz" />
          <Chip text="Water eject 30s" />
          <Chip text="Deep clean 2m" />
          <Chip text="PRO no ads" />
        </ScrollView>
      </Card>

      {/* AUTO */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Text style={styles.cardTitle}>Automatic Speaker Cleaning</Text>
        </View>

        <Text style={styles.cardDesc}>
          Sound waves tuned to help eject water and dust from your phone speaker (muffled sound fix).
        </Text>

        <View style={{ height: 14 }} />

        <PrimaryButton
          label="🧼 Quick Water Eject (30s)"
          onPress={() => navigation.navigate("Clean", { mode: "quick" })}
        />

        <View style={{ height: 10 }} />

        <View style={{ position: "relative" }}>
          {/* PRO badge top-right */}
          {!ent.canDeepClean && (
            <View style={{ position: "absolute", right: 10, top: -10, zIndex: 10 }}>
              <ProBadge />
            </View>
          )}

          <PrimaryButton
            label={ent.canDeepClean ? "🧽 Deep Speaker Clean (2 min)" : "🔒 Deep Speaker Clean (2 min)"}
            variant="secondary"
            onPress={async () => {
              if (!ent.canDeepClean) {

                await lockedFeedback(); // 🔥 vibración premium

                navigation.navigate("Paywall", { source: "deep-clean" });
                return;
              }

              navigation.navigate("Clean", { mode: "deep" });
            }}

          />
        </View>
      </Card>

      {/* MANUAL */}
      <Card>
        <Text style={styles.cardTitle}>Manual Frequency (Hz)</Text>
        <Text style={styles.cardDesc}>
          Try different frequencies for 5–10s and keep the one with the strongest vibration.
        </Text>

        <View style={{ height: 14 }} />

        <PrimaryButton
          label="🎛 Open Manual Hz"
          variant="secondary"
          onPress={() => navigation.navigate("Manual")}
        />
      </Card>

      {/* TIPS */}
      <Card style={{ padding: theme.space.md }}>
        <Text style={styles.tipTitle}>Quick tips</Text>
        <View style={{ gap: 6, marginTop: 10 }}>
          <Text style={styles.tip}>🔊 Set system volume to max</Text>
          <Text style={styles.tip}>📱 Keep the speaker facing down</Text>
          <Text style={styles.tip}>🧼 Remove the case if it blocks the grill</Text>
        </View>
      </Card>

      {/* PRO */}
      {ent.isPro ? (
        <PrimaryButton
          label="✅ PRO active"
          variant="secondary"
          onPress={() => navigation.navigate("Paywall", { source: "home" })}
        />
      ) : (
        <Animated.View style={{ transform: [{ scale: proScale }] }}>
          <PrimaryButton
            label="💎 Unlock PRO"
            onPress={() => navigation.navigate("Paywall", { source: "home" })}
          />
        </Animated.View>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: theme.space.lg },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.color.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(31,111,235,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSub: { marginTop: 2, color: theme.color.muted },

  cardTitle: { fontSize: 16, fontWeight: "900", color: theme.color.text },
  cardDesc: { marginTop: 6, fontSize: 13, color: theme.color.muted, lineHeight: 18 },

  tipTitle: { fontSize: 15, fontWeight: "900", color: theme.color.text },
  tip: { color: theme.color.muted },
});
