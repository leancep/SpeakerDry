import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable, Animated, Easing } from "react-native";
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

// ✅ FREE: solo 200 y 400
const STEPS_FREE = [200, 400] as const;

// ✅ PRO: todas
const STEPS_PRO = [200, 400, 800, 1200, 2000, 3000] as const;

export default function ManualScreen({ navigation }: Props) {
    const ent = useEntitlements();
    const { showActionEndAd } = useActionAd();

    const openedAtRef = useRef(Date.now());
    const didUseRef = useRef(false);

    const isProManual = ent.canManualUnlimited;

    // UI SIEMPRE muestra todos los steps (para que se vean los bloqueados)
    const steps = useMemo<number[]>(() => [...STEPS_PRO], []);

    // helper: FREE permitido solo los 2 primeros índices (0 y 1)
    const maxFreeIdx = 1;
    const isLockedIdx = (i: number) => !isProManual && i > maxFreeIdx;

    // default: PRO arranca en 800, FREE en 400 (o 200 si preferís)
    const defaultHz = isProManual ? 800 : 400;

    const [idx, setIdx] = useState(() => Math.max(0, steps.indexOf(defaultHz)));
    const lastAllowedIdxRef = useRef(idx); // para “rebotar” el slider
    const paywallLockRef = useRef(false); // evita abrir paywall 20 veces
    const [sliderKey, setSliderKey] = useState(0); // fuerza rebote visual


    const proAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isProManual) return; // solo FREE ve animación

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
    }, [isProManual]);

    const proScale = proAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });


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
                stopAudioNow();
                await showActionEndAd();
                await waitForUiSettled();
            } finally {
                navigation.dispatch(e.data.action);
            }
        });
        return unsub;
    }, [navigation, ent.isPro, showActionEndAd]);

    // si el usuario cambia de FREE->PRO o viceversa, acomodar índice
    useEffect(() => {
        if (isProManual) {
            // si pasa a PRO, dejá el idx actual (siempre válido)
            return;
        }
        // si pasa a FREE, si estaba en un idx bloqueado, bajalo a 400 (idx 1) o 200 (idx 0)
        if (idx > maxFreeIdx) {
            setIdx(1);
            lastAllowedIdxRef.current = 1;
            setPlaying(false);
            stopAudioNow();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isProManual]);


    function goPaywallSafe() {
        if (paywallLockRef.current) return;
        paywallLockRef.current = true;

        stopAudioNow();

        navigation.navigate("Paywall", { source: "manual" });

        // liberar lock luego de un rato (evita spam en drag)
        setTimeout(() => {
            paywallLockRef.current = false;
        }, 800);
    }


    async function applyHz(nextHz: number) {
        // ✅ gate FREE: solo 200/400
        if (!isProManual && !STEPS_FREE.includes(nextHz as any)) {
            goPaywallSafe();
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

        // doble seguridad por si quedara un hz bloqueado (no debería)
        if (!isProManual && !STEPS_FREE.includes(hz as any)) {
            goPaywallSafe();
            return;
        }

        try {
            await Player.playRaw(`tone_${hz}`, true, 1);
            setPlaying(true);
        } catch {
            setPlaying(false);
            Alert.alert("Audio not available", `Missing file: tone_${hz}.wav in res/raw`);
        }
    }

    function stopAudioNow() {
        try { Player.stop(); } catch { }
        setPlaying(false);
    }

    function onPause() {
        Player.pause();
        setPlaying(false);
    }

    const sliderMin = 0;
    const sliderMax = steps.length - 1;

    const handleSelectIdx = async (nextIdx: number) => {
        const clamped = Math.max(sliderMin, Math.min(sliderMax, nextIdx));

        if (isLockedIdx(clamped)) {

            // rebote al último permitido (o 1 = 400)
            const fallback = Math.min(maxFreeIdx, Math.max(0, lastAllowedIdxRef.current ?? 1));
            lastAllowedIdxRef.current = fallback;

            // cortar audio si estaba sonando
            stopAudioNow();

            // rebote visual: setIdx + forzar rerender del slider
            setIdx(fallback);
            setSliderKey(k => k + 1);

            goPaywallSafe();
            return;
        }

        setIdx(clamped);
        lastAllowedIdxRef.current = clamped;

        await applyHz(steps[clamped]);
    };


    return (
        <Screen scroll>
            <View style={{ gap: 6 }}>
                <Text style={styles.subtitle}>
                    Try a frequency for 5–10 seconds and keep the one with the strongest vibration.
                    {!isProManual ? " (FREE limited to 200–400 Hz)" : ""}
                </Text>
            </View>

            <Card style={styles.dialCard}>
                <View style={styles.dial}>
                    <View style={styles.dialInner}>
                        <Text style={styles.hz}>{hz} Hz</Text>
                        {!isProManual && (
                            <Pressable onPress={goPaywallSafe} hitSlop={10}>
                                <Text style={styles.proHint}>💎 More frequencies in PRO</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <View style={{ width: "100%", marginTop: 12 }}>
                    <Slider
                        key={sliderKey}
                        minimumValue={sliderMin}
                        maximumValue={sliderMax}
                        value={idx}
                        step={1}
                        minimumTrackTintColor={theme.color.primary}
                        maximumTrackTintColor={"rgba(255,255,255,0.12)"}
                        thumbTintColor={theme.color.primary}
                        onValueChange={async (v) => {
                            const nextIdx = Math.round(v);
                            await handleSelectIdx(nextIdx);
                        }}
                    />

                    <View style={styles.stepRow}>
                        {steps.map((s, i) => {
                            const locked = isLockedIdx(i);
                            const active = i === idx;

                            return (
                                <Pressable
                                    key={s}
                                    onPress={async () => {
                                        await handleSelectIdx(i);
                                    }}
                                    hitSlop={10}
                                    style={styles.stepWrap}
                                >
                                    <Text
                                        style={[
                                            styles.step,
                                            locked && styles.stepLocked,
                                            active && !locked && styles.stepActive,
                                        ]}
                                    >
                                        {s}
                                    </Text>

                                    {/* candadito debajo del número */}
                                    {!isProManual && i > maxFreeIdx ? (
                                        <Text style={styles.lock}>🔒</Text>
                                    ) : (
                                        <Text style={styles.lockPlaceholder}> </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={{ height: 10 }} />

                {playing ? (
                    <PrimaryButton label="⏸ Pause" onPress={onPause} />
                ) : (
                    <PrimaryButton label="▶️ Play" onPress={onPlay} />
                )}

                <PrimaryButton label="⏹ Stop" variant="secondary" onPress={stopAudioNow} />

                {!isProManual && (
                    <Animated.View
                        style={{
                            transform: [{ scale: proScale }],
                        }}
                    >
                        <PrimaryButton
                            label="💎 Unlock PRO"
                            onPress={goPaywallSafe}
                        />
                    </Animated.View>
                )}

            </Card>

            <Card style={styles.tipsCard}>
                <Text style={styles.tipTitle}>Quick tips</Text>
                <Text style={styles.tip}>🔊 Set system volume to max but stop if discomfort</Text>
                <Text style={styles.tip}>📱 Keep the speaker facing down</Text>
                <Text style={styles.tip}>🧼 Remove the case if it blocks the grill</Text>
                <Text style={styles.tip}>👂 Don’t use near ear</Text>
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
    proHint: {
        color: theme.color.primary,
        fontSize: 12,
        fontWeight: "800",
        marginTop: 2,
        textDecorationLine: "underline",
    },

    stepRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        alignItems: "flex-start",
    },
    stepWrap: { alignItems: "center", minWidth: 42 },
    step: { color: theme.color.muted, fontSize: 11, paddingHorizontal: 2, paddingVertical: 2 },
    stepActive: { color: theme.color.text, fontWeight: "900" },

    stepLocked: { color: "rgba(255,255,255,0.30)" },
    lock: { fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.35)" },
    lockPlaceholder: { fontSize: 10, marginTop: 2, color: "transparent" },

    tipTitle: { fontSize: 14, fontWeight: "900", color: theme.color.text, marginBottom: 6 },
    tip: { color: theme.color.muted, lineHeight: 18 },
    tipsCard: { padding: theme.space.md },
});
