import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import PrimaryButton from "../components/PrimaryButton";
import ProgressRing from "../components/ProgressRing";
import * as Player from "../audio/player";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import { Animated, Easing } from "react-native";
import { useEntitlements } from "../pro/EntitlementsProvider";




type Props = NativeStackScreenProps<RootStackParamList, "Clean">;

export default function CleanScreen({ route, navigation }: Props) {
    const { mode } = route.params;
    const ent = useEntitlements();


    const rawName = useMemo(() => (mode === "quick" ? "clean_quick" : "clean_deep"), [mode]);

    const [durationSec, setDurationSec] = useState(0);
    const [currentSec, setCurrentSec] = useState(0);
    const [status, setStatus] = useState<"loading" | "playing" | "paused" | "done">("loading");

    const tickRef = useRef<NodeJS.Timeout | null>(null);

    const percent = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;

    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (status !== "playing") {
            pulse.stopAnimation();
            pulse.setValue(1);
            return;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.02, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1.0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );

        loop.start();
        return () => loop.stop();
    }, [status, pulse]);


    async function startTicking() {
        if (tickRef.current) return;
        tickRef.current = setInterval(async () => {
            const sec = await Player.getCurrentTimeSec();
            setCurrentSec(sec);

            if (durationSec > 0 && sec >= durationSec - 0.05) {
                setStatus("done");
                stopTicking();
            }
        }, 200);
    }

    function stopTicking() {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
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


                const { durationSec } = await Player.loadRaw(rawName);
                if (!mounted) return;

                setDurationSec(durationSec);
                setStatus("playing");

                Player.play({
                    loop: false,
                    volume: 1,
                    onEnd: () => {
                        setCurrentSec(durationSec);
                        setStatus("done");
                        stopTicking();
                    },
                });

                startTicking();
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

    const modeLabel = mode === "quick" ? "Rápido" : "Profundo";

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>Limpiando altavoz</Text>
                <Text style={styles.subtitle}>
                    Modo {modeLabel} · mantené el volumen alto
                </Text>
            </View>

            <Card style={styles.centerCard}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                    <ProgressRing percent={percent} label={modeLabel} glow={status === "playing"} />
                </Animated.View>


                <Text style={styles.time}>
                    {durationSec > 0 ? `${currentSec.toFixed(1)}s / ${durationSec.toFixed(1)}s` : ""}
                </Text>
            </Card>

            <Card style={styles.tipsCard}>
                <Text style={styles.tipTitle}>Tips rápidos</Text>
                <Text style={styles.tip}>🔊 Subí el volumen del sistema</Text>
                <Text style={styles.tip}>📱 Altavoz mirando hacia abajo</Text>
                <Text style={styles.tip}>🧼 Quitá la funda si tapa la rejilla</Text>
            </Card>

            <View style={styles.controls}>
                {status === "loading" ? (
                    <PrimaryButton label="Cargando audio…" onPress={() => { }} loading />
                ) : status === "playing" ? (
                    <PrimaryButton
                        label="⏸ Pausa"
                        onPress={() => {
                            Player.pause();
                            setStatus("paused");
                            stopTicking();
                        }}
                    />
                ) : status === "paused" ? (
                    <PrimaryButton
                        label="▶️ Reanudar"
                        onPress={() => {
                            setStatus("playing");
                            Player.play({
                                loop: false,
                                volume: 1,
                                onEnd: () => {
                                    setCurrentSec(durationSec);
                                    setStatus("done");
                                    stopTicking();
                                },
                            });
                            startTicking();
                        }}
                    />
                ) : (
                    <PrimaryButton label="✅ Terminar" onPress={() => navigation.popToTop()} />
                )}

                <PrimaryButton
                    label="⏹ Stop"
                    variant="secondary"
                    onPress={() => {
                        Player.stop();
                        setCurrentSec(0);
                        setStatus("done");
                        stopTicking();
                    }}
                />
            </View>

            <Text style={styles.disclaimer}>
                Ayuda a expulsar agua de la rejilla del altavoz. No reemplaza un servicio técnico si el equipo
                quedó con daño interno.
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

    tipsCard: { padding: theme.space.md },
    tipTitle: { fontSize: 15, fontWeight: "900", color: theme.color.text, marginBottom: 6 },
    tip: { color: theme.color.muted, marginTop: 4 },

    controls: { gap: 10 },

    disclaimer: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 4 },
});
