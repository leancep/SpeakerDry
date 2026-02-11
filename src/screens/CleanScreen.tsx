import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import PrimaryButton from "../components/PrimaryButton";
import ProgressRing from "../components/ProgressRing";
import * as Player from "../audio/player";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import { useEntitlements } from "../pro/EntitlementsProvider";
import { useActionAd } from "../ads/useActionAd";
import { waitForUiSettled } from "../ads/navAfterAd";

type Props = NativeStackScreenProps<RootStackParamList, "Clean">;

export default function CleanScreen({ route, navigation }: Props) {
    const { mode } = route.params;
    const ent = useEntitlements();
    const { showActionEndAd } = useActionAd();

    const rawName = useMemo(() => (mode === "quick" ? "clean_quick" : "clean_deep"), [mode]);

    const [durationSec, setDurationSec] = useState(0);
    const [currentSec, setCurrentSec] = useState(0);
    const [status, setStatus] = useState<"loading" | "playing" | "paused" | "done">("loading");

    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationRef = useRef(0);


    const percent = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
    const pulse = useRef(new Animated.Value(1)).current;
    const [completedVisual, setCompletedVisual] = useState(false);

    useEffect(() => {
        if (status !== "playing") {
            pulse.stopAnimation();
            pulse.setValue(1);
            return;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.02,
                    duration: 600,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1.0,
                    duration: 600,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        loop.start();
        return () => loop.stop();
    }, [status, pulse]);

    function stopTicking() {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
    }

    function startTicking() {
        if (tickRef.current) return;

        tickRef.current = setInterval(async () => {
            if (!Player.isLoaded()) return;

            const sec = await Player.getCurrentTimeSec();
            setCurrentSec(sec);

            const d = durationRef.current;
            if (d > 0 && sec >= d - 0.05) {
                setStatus("done");
                stopTicking();
            }
        }, 200);
    }

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setStatus("loading");
                setCurrentSec(0);

                if (mode === "deep" && !ent.canDeepClean) {
                    navigation.replace("Paywall", { source: "deep-clean" });
                    return;
                }

                const { durationSec: dur } = await Player.loadRaw(rawName);
                if (!mounted) return;

                durationRef.current = dur;
                setDurationSec(dur);
                setStatus("paused");
            } catch {
                setStatus("done");
                stopTicking();
            }
        })();

        return () => {
            mounted = false;
            stopTicking();
            Player.release();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawName]);

    const modeLabel = mode === "quick" ? "Quick" : "Deep";
    const modeHint =
        mode === "quick"
            ? "Quick mode · keep volume high"
            : "Deep mode · keep volume high";

    const onPlayFromStart = () => {
        finishingRef.current = false;
        setCompletedVisual(false);
        setCurrentSec(0);
        setStatus("playing");
        Player.play({
            loop: false,
            volume: 1,
            resetToStart: true,
            onEnd: async () => {
                const d = durationRef.current;
                setCurrentSec(d);
                await finishFlow();
            },
        });


        startTicking();
    };

    const onResume = () => {
        finishingRef.current = false;
        setStatus("playing");
        setCompletedVisual(false);

        Player.play({
            loop: false,
            volume: 1,
            resetToStart: false,
            onEnd: async () => {
                const d = durationRef.current;
                setCurrentSec(d);
                await finishFlow();
            },
        });


        startTicking();
    };

    const onPause = () => {
        Player.pause();
        setStatus("paused");
        stopTicking();
    };

    const onStop = () => {
        Player.stop();
        setCurrentSec(0);
        setStatus("paused");
        stopTicking();
    };
    const finishingRef = useRef(false);
    const finishFlow = async () => {
        if (finishingRef.current) return;
        finishingRef.current = true;

        // parar audio/tick para evitar eventos dobles
        try { Player.stop(); } catch { }
        stopTicking();

        setStatus("done");
        setCompletedVisual(true);

        // ✅ PRO: se queda en la screen
        if (ent.isPro) {
            finishingRef.current = false; // permitir que toque Done después
            return;
        }
        await new Promise(r => setTimeout(r, 600)); //DELAY MS
        await showActionEndAd();
        // evita crash de navegación / header re-parent
        await waitForUiSettled();

        navigation.popToTop();
    };

    const exitAfterDone = async () => {
        if (ent.isPro) {
            navigation.goBack();
            return;
        }
        // FREE: si por alguna razón no navegó aún, navega acá
        await waitForUiSettled();
        navigation.popToTop();
    };


    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>Cleaning speaker</Text>
                <Text style={styles.subtitle}>{modeHint}</Text>
            </View>

            <Card style={styles.centerCard}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                    <ProgressRing percent={percent} label={modeLabel} glow={status === "playing"} />
                </Animated.View>

                {completedVisual && (
                    <Text style={{
                        marginTop: 6,
                        color: theme.color.success,
                        fontWeight: "900"
                    }}>
                        ✅ Completed
                    </Text>
                )}

                <Text style={styles.time}>
                    {durationSec > 0 ? `${currentSec.toFixed(1)}s / ${durationSec.toFixed(1)}s` : ""}
                </Text>

                <Text style={styles.microCopy}>
                    {status === "playing"
                        ? "Sound waves are vibrating to help eject water & debris."
                        : "Press Play and keep volume high."}
                </Text>
            </Card>

            <Card style={styles.tipsCard}>
                <Text style={styles.tipTitle}>Quick tips</Text>
                <Text style={styles.tip}>🔊 Set system volume to max</Text>
                <Text style={styles.tip}>📱 Keep the speaker facing down</Text>
                <Text style={styles.tip}>🧼 Remove the case if it blocks the grill</Text>
            </Card>

            <View style={styles.controls}>
                {status === "loading" ? (
                    <PrimaryButton label="Loading audio…" onPress={() => { }} loading />
                ) : status === "playing" ? (
                    <PrimaryButton label="⏸ Pause" onPress={onPause} />
                ) : status === "paused" ? (
                    <PrimaryButton
                        label={currentSec > 0 ? "▶️ Resume" : "▶️ Play"}
                        onPress={currentSec > 0 ? onResume : onPlayFromStart}
                    />
                ) : (
                    <PrimaryButton label={ent.isPro ? "⬅️ Back" : "✅ Done"} onPress={exitAfterDone} />

                )}

                <PrimaryButton
                    label="⏹ Stop"
                    variant="secondary"
                    onPress={onStop}
                    disabled={status === "done" || status === "loading"}
                />
            </View>

            <Text style={styles.disclaimer}>
                Helps eject water from the speaker grill. It won’t fix hardware damage or internal corrosion.
            </Text>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { gap: 6 },
    title: { fontSize: 24, fontWeight: "900", color: theme.color.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

    centerCard: { alignItems: "center", gap: 10 },
    time: { color: theme.color.muted },

    microCopy: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 2 },

    tipsCard: { padding: theme.space.md },
    tipTitle: { fontSize: 15, fontWeight: "900", color: theme.color.text, marginBottom: 6 },
    tip: { color: theme.color.muted, marginTop: 4 },
    completed: {
        marginTop: 6,
        color: theme.color.success,
        fontWeight: "900",
        textAlign: "center",
    },
    controls: { gap: 10 },

    disclaimer: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 4 },
});
