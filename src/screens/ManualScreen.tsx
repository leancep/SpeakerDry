import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import PrimaryButton from "../components/PrimaryButton";
import * as Player from "../audio/player";
import { useEntitlements } from "../pro/EntitlementsProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Manual">;

// ✅ FREE (según tus WAVs)
const STEPS_FREE = [200, 400, 800, 1200] as const;

// ⚠️ IMPORTANTE:
// Dijiste que en res/raw tenés: 200, 400, 800, 1200, 2000, 3000
// Si NO tenés tone_300.wav y tone_600.wav, dejá STEPS_PRO sin 300/600.
// Si sí los agregás, podés volver a ponerlos.
const STEPS_PRO = [200, 400, 800, 1200, 2000, 3000] as const;

export default function ManualScreen({ navigation }: Props) {
  const ent = useEntitlements();

  const steps = useMemo<number[]>(
    () => (ent.canManualUnlimited ? [...STEPS_PRO] : [...STEPS_FREE]),
    [ent.canManualUnlimited]
  );

  const defaultHz = steps.includes(800) ? 800 : steps[0];
  const [idx, setIdx] = useState(() => Math.max(0, steps.indexOf(defaultHz)));
  const hz = steps[idx];

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => Player.stop();
  }, []);

  // Si cambia FREE/PRO y el hz actual no existe en el set nuevo, re-encauzar.
  useEffect(() => {
    const currentHz = steps[idx] ?? defaultHz;
    const nextIdx = steps.indexOf(currentHz);
    setIdx(nextIdx === -1 ? 0 : nextIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ent.canManualUnlimited]);

  function goPaywall() {
    navigation.navigate("Paywall", { source: "manual" });
  }

  async function applyHz(nextHz: number) {
    // defensivo (por si en algún momento reintroducís 300/600 sin WAVs)
    if (!ent.canManualUnlimited && !STEPS_FREE.includes(nextHz as any)) {
      goPaywall();
      return;
    }

    // Si estaba sonando, cambiamos estable: stop → play del nuevo tono
    if (playing) {
      try {
        Player.stop();
        await Player.playRaw(`tone_${nextHz}`, true, 1);
        setPlaying(true);
      } catch (e: any) {
        setPlaying(false);
        Alert.alert(
          "Audio no disponible",
          `No se encontró el tono tone_${nextHz}.wav en res/raw`
        );
      }
    }
  }

  async function onPlay() {
    try {
      await Player.playRaw(`tone_${hz}`, true, 1);
      setPlaying(true);
    } catch (e: any) {
      setPlaying(false);
      Alert.alert(
        "Audio no disponible",
        `No se encontró el tono tone_${hz}.wav en res/raw`
      );
    }
  }

  function onPause() {
    Player.pause();
    setPlaying(false);
  }

  function onStop() {
    Player.stop();
    setPlaying(false);
  }

  const sliderMin = 0;
  const sliderMax = Math.max(0, steps.length - 1);

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
              <Text style={styles.proHint}>💎 Más frecuencias en PRO</Text>
            )}
          </View>
        </View>

        <View style={{ width: "100%", marginTop: 12 }}>
          {/* ✅ Slider por índice (alineación perfecta con labels) */}
          <Slider
            minimumValue={sliderMin}
            maximumValue={sliderMax}
            value={idx}
            step={1}
            minimumTrackTintColor={theme.color.primary}
            maximumTrackTintColor={"rgba(255,255,255,0.12)"}
            thumbTintColor={theme.color.primary}
            onValueChange={async (v) => {
              const nextIdx = Math.max(0, Math.min(sliderMax, Math.round(v)));
              setIdx(nextIdx);
              await applyHz(steps[nextIdx]);
            }}
          />

          <View style={styles.stepRow}>
            {steps.map((s, i) => (
              <Text
                key={s}
                style={[styles.step, i === idx && styles.stepActive]}
                onPress={async () => {
                  setIdx(i);
                  await applyHz(s);
                }}
              >
                {s}
              </Text>
            ))}
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

  tipTitle: { fontSize: 14, fontWeight: "900", color: theme.color.text, marginBottom: 6 },
  tip: { color: theme.color.muted, lineHeight: 18 },
});
