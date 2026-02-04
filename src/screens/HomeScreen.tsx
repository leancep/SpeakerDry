import React from "react";
import { Text, StyleSheet, View, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import PrimaryButton from "../components/PrimaryButton";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import Chip from "../components/Chip";
import { useEntitlements } from "../pro/EntitlementsProvider";
import ProBadge from "../components/ProBadge";



type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {

    const ent = useEntitlements();

    return (
        <Screen>
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
                                {ent.isPro ? "PRO activado · sin límites" : "Limpieza por frecuencias"}
                            </Text>
                            {ent.isPro ? (
                                <ProBadge text="PRO ACTIVO" variant="active" />
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
                    <Chip text="Sin registro" />
                    <Chip text="Hz manual" />
                    <Chip text="Rápido 30s" />
                    <Chip text="Profundo 2m" />
                    <Chip text="PRO sin ads" />
                </ScrollView>
            </Card>

            {/* AUTO */}
            <Card>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Text style={styles.cardTitle}>Limpieza automática</Text>
                </View>

                <Text style={styles.cardDesc}>
                    Barrido optimizado para vibrar el altavoz y ayudar a expulsar agua.
                </Text>

                <View style={{ height: 14 }} />

                <PrimaryButton
                    label="🧼 Limpieza rápida (30s)"
                    onPress={() => navigation.navigate("Clean", { mode: "quick" })}
                />

                <View style={{ height: 10 }} />

                <View style={{ position: "relative" }}>
                    {/* Badge PRO arriba a la derecha */}
                    {!ent.canDeepClean && (
                        <View style={{ position: "absolute", right: 10, top: -10, zIndex: 10 }}>
                            <ProBadge />
                        </View>
                    )}

                    <PrimaryButton
                        label={ent.canDeepClean ? "🧽 Limpieza profunda (2 min)" : "🔒 Limpieza profunda (2 min)"}
                        variant="secondary"
                        onPress={() => {
                            if (!ent.canDeepClean) {
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
                <Text style={styles.cardTitle}>Manual (Hz)</Text>
                <Text style={styles.cardDesc}>Elegí una frecuencia y probá cuál vibra mejor en tu equipo.</Text>

                <View style={{ height: 14 }} />

                <PrimaryButton
                    label="🎛 Abrir manual"
                    variant="secondary"
                    onPress={() => navigation.navigate("Manual")}
                />
            </Card>

            {/* TIPS compactos */}
            <Card style={{ padding: theme.space.md }}>
                <Text style={styles.tipTitle}>Tips rápidos</Text>
                <View style={{ gap: 6, marginTop: 10 }}>
                    <Text style={styles.tip}>🔊 Volumen del sistema al máximo</Text>
                    <Text style={styles.tip}>📱 Altavoz mirando hacia abajo</Text>
                    <Text style={styles.tip}>🧼 Sacá la funda si tapa la rejilla</Text>
                </View>
            </Card>

            {/* PRO */}
            {ent.isPro ? (
                <PrimaryButton
                    label="✅ PRO activo"
                    variant="ghost"
                    onPress={() => navigation.navigate("Paywall", { source: "home" })}
                />
            ) : (
                <PrimaryButton
                    label="💎 Desbloquear PRO"
                    variant="ghost"
                    onPress={() => navigation.navigate("Paywall", { source: "home" })}
                />
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
    heroTitle: { fontSize: 22, fontWeight: "900", color: theme.color.text },
    heroSub: { marginTop: 2, color: theme.color.muted },

    cardTitle: { fontSize: 16, fontWeight: "900", color: theme.color.text },
    cardDesc: { marginTop: 6, fontSize: 13, color: theme.color.muted, lineHeight: 18 },

    tipTitle: { fontSize: 15, fontWeight: "900", color: theme.color.text },
    tip: { color: theme.color.muted },
});
