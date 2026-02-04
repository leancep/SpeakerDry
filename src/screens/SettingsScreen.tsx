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
        <Screen>
            <View style={{ gap: 6 }}>
                <Text style={styles.subtitle}>Información, estado PRO y utilidades.</Text>
            </View>

            <Card style={{ gap: 10 }}>
                <View style={styles.row}>
                    <Text style={styles.h}>Estado</Text>
                    {ent.isPro ? <ProBadge text="PRO ACTIVO" variant="active" /> : <ProBadge text="FREE" variant="pro" />}
                </View>

                <Text style={styles.p}>
                    {ent.isPro
                        ? "Tenés PRO habilitado. Deep Clean y Hz avanzados disponibles."
                        : "Estás en FREE. Deep Clean y Hz avanzados se desbloquean con PRO."}
                </Text>

                <PrimaryButton
                    label={ent.isPro ? "Ver beneficios PRO" : "Desbloquear PRO"}
                    variant="secondary"
                    onPress={() => navigation.navigate("Paywall", { source: "home" })}
                />

            </Card>

            <Card style={{ gap: 8 }}>
                <Text style={styles.h}>Acerca de</Text>
                <Text style={styles.p}>SpeakerDry · Limpieza por frecuencias.</Text>
                <Text style={styles.pSmall}>Versión: 0.1.0</Text>
            </Card>

            {__DEV__ && (
                <Card style={{ gap: 10 }}>
                    <Text style={styles.h}>Dev tools</Text>

                    <PrimaryButton
                        label={ent.isPro ? "✅ PRO activo (tocar para desactivar)" : "🔓 Activar PRO (DEV)"}
                        variant="secondary"
                        onPress={() => ent.togglePro()}
                    />

                    <Text style={styles.pSmall}>
                        Solo visible en desarrollo. Persiste en el dispositivo.
                    </Text>
                </Card>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: "900", color: theme.color.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    h: { fontSize: 16, fontWeight: "900", color: theme.color.text },
    p: { color: theme.color.muted, lineHeight: 18 },
    pSmall: { color: theme.color.muted, fontSize: 12 },
});
