import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import PrimaryButton from "../components/PrimaryButton";
import * as Player from "../audio/player";
import { useEntitlements } from "../pro/EntitlementsProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import { useActionAd } from "../ads/useActionAd";
import { waitForUiSettled } from "../ads/navAfterAd";

type Props = NativeStackScreenProps<RootStackParamList, "Manual">;

const STEPS_FREE = [200, 400, 800, 1200] as const;
const STEPS_PRO = [200, 400, 800, 1200, 2000, 3000] as const;

export default function ManualScreen({ navigation }: Props) {
    const ent = useEntitlements();
    const { showActionEndAd } = useActionAd();

    const openedAtRef = useRef(Date.now());
    const didUseRef = useRef(false);

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

    const exitingRef = useRef(false);
    useEffect(() => {
        const unsub = navigation.addListener("beforeRemove", async (e) => {
            if (ent.isPro) return;
            if (exitingRef.current) return;

            const elapsed = Date.now() - openedAtRef.current;
            const shouldShow = didUseRef.current && elapsed >= 12_000;

            if (!shouldShow) return;

            e.preventDefault();
            exitingRef.current = true;
            try {
                Player.stop();
                setPlaying(false);
                await showActionEndAd();
                await waitForUiSettled();
            } finally {
                navigation.dispatch(e.data.action);
            }
        });
        return unsub;
    }, [navigation, ent.isPro, showActionEndAd]);

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
        if (!ent.canManualUnlimited && !STEPS_FREE.includes(nextHz as any)) {
            goPaywall();
            return;
        }

        if (playing) {
            didUseRef.current = true;
            try {
                Player.stop();
                await Player.playRaw(`tone_${nextHz}`, true, 1);
                setPlaying(true);
            } catch {
                setPlaying(false);
                Alert.alert("Audio not available", `Missing file: tone_${nextHz}.wav in res/raw`);
            }
        }
    }

    async function onPlay() {
        didUseRef.current = true;
        try {
            await Player.playRaw(`tone_${hz}`, true, 1);
            setPlaying(true);
        } catch {
            setPlaying(false);
            Alert.alert("Audio not available", `Missing file: tone_${hz}.wav in res/raw`);
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
                    Try a frequency for 5–10 seconds and keep the one with the strongest vibration.
                    {!ent.canManualUnlimited ? " (FREE limited)" : ""}
                </Text>
            </View>

            <Card style={styles.dialCard}>
                <View style={styles.dial}>
                    <View style={styles.dialInner}>
                        <Text style={styles.hz}>{hz} Hz</Text>
                        <Text style={styles.hint}>Steady vibration tone</Text>
                        {!ent.canManualUnlimited && (
                            <Text style={styles.proHint}>💎 More frequencies in PRO</Text>
                        )}
                    </View>
                </View>

                <View style={{ width: "100%", marginTop: 12 }}>
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
                    <PrimaryButton label="⏸ Pause" onPress={onPause} />
                ) : (
                    <PrimaryButton label="▶️ Play" onPress={onPlay} />
                )}

                <PrimaryButton label="⏹ Stop" variant="secondary" onPress={onStop} />

                {!ent.canManualUnlimited && (
                    <PrimaryButton label="💎 Unlock PRO" variant="ghost" onPress={goPaywall} />
                )}
            </Card>

            <Card style={{ padding: 14 }}>
                <Text style={styles.tipTitle}>Tip</Text>
                <Text style={styles.tip}>
                    🔊 Volume max · 📱 speaker down · 🧼 remove case if it blocks the grill
                </Text>
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
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
