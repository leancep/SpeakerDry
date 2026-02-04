import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import PrimaryButton from "../components/PrimaryButton";
import * as Player from "../audio/player";
import { useEntitlements } from "../pro/EntitlementsProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Manual">;

const STEPS_FREE = [200, 400, 800, 1200] as const;
const STEPS_PRO = [200, 300, 400, 600, 800, 1200, 2000, 3000] as const;

function nearestStepFrom(v: number, steps: readonly number[]) {
  let best = steps[0];
  let bestDiff = Math.abs(v - best);
  for (const s of steps) {
    const d = Math.abs(v - s);
    if (d < bestDiff) {
      best = s;
      bestDiff = d;
    }
  }
  return best;
}

export default function ManualScreen({ navigation }: Props) {
  const ent = useEntitlements();

  const steps = ent.canManualUnlimited ? STEPS_PRO : STEPS_FREE;

  const [hz, setHz] = useState<number>(steps.includes(800) ? 800 : steps[0]);
  const [playing, setPlaying] = useState(false);

  const toneName = useMemo(() => `tone_${hz}`, [hz]);

  useEffect(() => {
    return () => Player.stop();
  }, []);

  // Si el user es FREE y quedó en un Hz no permitido (por hot-reload / cambios), lo re-encauzamos
  useEffect(() => {
    if (!steps.includes(hz)) setHz(steps[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ent.canManualUnlimited]);

  async function onPlay() {
    await Player.playRaw(toneName, true, 1);
    setPlaying(true);
  }

  function onPause() {
    Player.pause();
    setPlaying(false);
  }

  function onStop() {
    Player.stop();
    setPlaying(false);
  }

  function goPaywall() {
    navigation.navigate("Paywall", { source: "manual" });
  }

  function setHzGuarded(next: number) {
    // FREE: si intenta un paso PRO, lo mandamos al paywall
    if (!ent.canManualUnlimited && !STEPS_FREE.includes(next as any)) {
      goPaywall();
      return;
    }
    setHz(next);
    if (playing) Player.playRaw(`tone_${next}`, true, 1);
  }

  const min = steps[0];
  const max = steps[steps.length - 1];

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={styles.subtitle}>
          Elegí una frecuencia y probá 5–10s.
          {!ent.canManualUnlimited ? " (FREE limitado)" : ""}
        </Text>
      </View>

      <Card style={styles.dialCard}>
        <View style={styles.dial}>
          <View style={styles.dialInner}>
            <Text style={styles.hz}>{hz} Hz</Text>
            <Text style={styles.hint}>Seno · vibración constante</Text>
            {!ent.canManualUnlimited && (
              <Text style={styles.proHint}>
                💎 Más frecuencias en PRO
              </Text>
            )}
          </View>
        </View>

        <View style={{ width: "100%", marginTop: 12 }}>
          <Slider
            minimumValue={min}
            maximumValue={max}
            value={hz}
            step={1}
            minimumTrackTintColor={theme.color.primary}
            maximumTrackTintColor={"rgba(255,255,255,0.12)"}
            thumbTintColor={theme.color.primary}
            onValueChange={(v) => {
              const next = nearestStepFrom(v, steps);
              setHzGuarded(next);
            }}
          />

          <View style={styles.stepRow}>
            {steps.map((s) => {
              const locked = !ent.canManualUnlimited && !STEPS_FREE.includes(s as any);
              return (
                <Text
                  key={s}
                  style={[
                    styles.step,
                    s === hz && styles.stepActive,
                    locked && styles.stepLocked,
                  ]}
                  onPress={() => (locked ? goPaywall() : setHzGuarded(s))}
                >
                 {locked ? `${s}🔒` : s}

                </Text>
              );
            })}
          </View>
        </View>

        <View style={{ height: 10 }} />

        {playing ? (
          <PrimaryButton label="⏸ Pausa" onPress={onPause} />
        ) : (
          <PrimaryButton label="▶️ Play" onPress={onPlay} />
        )}

        <PrimaryButton label="⏹ Stop" variant="secondary" onPress={onStop} />

        {!ent.canManualUnlimited && (
          <PrimaryButton label="💎 Desbloquear PRO" variant="ghost" onPress={goPaywall} />
        )}
      </Card>

      <Card style={{ padding: 14 }}>
        <Text style={styles.tipTitle}>Tip</Text>
        <Text style={styles.tip}>🔊 Volumen alto · 📱 altavoz hacia abajo · 🧼 sin funda</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", color: theme.color.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

  dialCard: { alignItems: "center", gap: 10 },

  dial: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 14,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: theme.color.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  dialInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  hz: { fontSize: 42, fontWeight: "900", color: theme.color.text },
  hint: { color: theme.color.muted, fontSize: 12 },
  proHint: { color: theme.color.primary, fontSize: 12, fontWeight: "800", marginTop: 2 },

  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },
  step: { color: theme.color.muted, fontSize: 11, paddingHorizontal: 2, paddingVertical: 2 },
  stepActive: { color: theme.color.text, fontWeight: "900" },
  stepLocked: { opacity: 0.6 },

  tipTitle: { fontSize: 14, fontWeight: "900", color: theme.color.text, marginBottom: 6 },
  tip: { color: theme.color.muted, lineHeight: 18 },
});
