import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";
import { useEntitlements } from "../pro/EntitlementsProvider";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Item = { title: string; body: string };

function MiniChip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function AccordionRow({
  title,
  body,
  open,
  onToggle,
}: {
  title: string;
  body: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
      }}
      style={({ pressed }) => [styles.accRow, { opacity: pressed ? 0.86 : 1 }]}
      hitSlop={10}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.accTitle} numberOfLines={1}>
          {title}
        </Text>
        {open && <Text style={styles.accBody}>{body}</Text>}
      </View>
      <Text style={styles.accIcon}>{open ? "−" : "+"}</Text>
    </Pressable>
  );
}

export default function PaywallScreen({ navigation }: Props) {
  const ent = useEntitlements();
  const [open, setOpen] = useState<number | null>(null);

  const whyPro: Item[] = useMemo(
    () => [
      {
        title: "Stronger cleaning patterns",
        body:
          "PRO unlocks deeper vibration patterns designed to help eject water and loose debris more effectively on some devices.",
      },
      {
        title: "Full frequency range",
        body:
          "Access the complete 200–3000 Hz range to find the strongest vibration for your speaker (especially when sound is muffled).",
      },
      {
        title: "No ads, cleaner flow",
        body: "Enjoy a distraction-free experience while running speaker cleaning sessions.",
      },
    ],
    []
  );

  const faq: Item[] = useMemo(
    () => [
      {
        title: "Will PRO guarantee results?",
        body:
          "No. Results vary by device and condition. SpeakerDry is not a repair tool and cannot fix hardware damage or corrosion.",
      },
      {
        title: "How do I get the best results?",
        body:
          "Set system volume to max, keep the speaker facing down, and remove the case if it blocks the grill. Start with Quick (30s), then try Deep (2 min) if needed.",
      },
      {
        title: "Can I cancel anytime?",
        body: "Yes. You can cancel your subscription anytime in Google Play subscription settings.",
      },
    ],
    []
  );

  return (
    <Screen scroll>

      <View style={styles.header}>
        <Text style={styles.title}>Unlock PRO Cleaning</Text>
        <Text style={styles.subtitle}>
          Stronger vibration, deeper cleaning, and no ads.
        </Text>

        <View style={styles.chipRow}>
          <MiniChip text="Deep Clean 2 min" />
          <MiniChip text="200–3000 Hz" />
          <MiniChip text="Ad-free" />
        </View>
      </View>

      {/* VALUE CARD */}
      <Card style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>What you get</Text>

        <View style={{ gap: 8, marginTop: 6 }}>
          <Text style={styles.item}>✅ Deep Speaker Clean mode (2 min)</Text>
          <Text style={styles.item}>✅ Full frequency range (200–3000 Hz)</Text>
          <Text style={styles.item}>✅ No ads experience</Text>
        </View>

        <View style={{ height: 14 }} />

        <View style={styles.priceBox}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Monthly plan</Text>
          </View>
          <Text style={styles.priceText}>{ent.proLabel}</Text>
          <Text style={styles.micro}>
            Cancel anytime • Managed in Google Play
          </Text>
        </View>

        <View style={{ height: 12 }} />

        {ent.isPro ? (
          <PrimaryButton label="✅ PRO active" onPress={() => navigation.goBack()} />
        ) : (
          <>
            <PrimaryButton label="💎 Start PRO" onPress={ent.buyPro} />
            <View style={{ height: 10 }} />
          </>
        )}

        {!ent.isPro && (
          <Text style={styles.trust}>
            Tip: Most users try Quick first, then Deep Clean if sound is still muffled.
          </Text>
        )}
      </Card>

      {/* WHY PRO */}
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Why upgrade?</Text>
          <Text style={styles.smallMuted}>Tap to expand</Text>
        </View>

        <View style={styles.accWrap}>
          {whyPro.map((it, idx) => (
            <AccordionRow
              key={`why-${idx}`}
              title={it.title}
              body={it.body}
              open={open === idx}
              onToggle={() => setOpen(open === idx ? null : idx)}
            />
          ))}
        </View>
      </Card>

      {/* FAQ / SAFETY */}
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Quick FAQ</Text>
          <Text style={styles.smallMuted}>Tap to expand</Text>
        </View>

        <View style={styles.accWrap}>
          {faq.map((it, idx) => {
            const key = 100 + idx; // avoid collision with previous
            return (
              <AccordionRow
                key={`faq-${idx}`}
                title={it.title}
                body={it.body}
                open={open === key}
                onToggle={() => setOpen(open === key ? null : key)}
              />
            );
          })}
        </View>

        <Text style={styles.disclaimer}>
          SpeakerDry plays audio vibration patterns that may help eject water and loose debris.
          It does not guarantee results and does not repair hardware damage or corrosion.
        </Text>
      </Card>

      <PrimaryButton label="No thanks" variant="ghost" onPress={() => navigation.goBack()} />

      <Text style={styles.legal}>
        Cancel anytime. Purchases are managed in Google Play.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginTop: 6 },
  title: { fontSize: 28, fontWeight: "900", color: theme.color.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.color.card2,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  chipText: { color: theme.color.muted, fontSize: 12, fontWeight: "700" },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: theme.color.text },
  item: { color: theme.color.muted },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  smallMuted: { color: theme.color.muted, fontSize: 12 },

  priceBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card2,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.color.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(31,111,235,0.35)",
  },
  badgeText: { color: theme.color.primary, fontWeight: "900", fontSize: 12 },
  priceText: { color: theme.color.text, fontSize: 14, fontWeight: "900" },
  micro: { color: theme.color.muted, fontSize: 12, lineHeight: 16 },

  trust: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 10 },

  accWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.color.border,
    overflow: "hidden",
  },
  accRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
    backgroundColor: theme.color.card2,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  accTitle: { color: theme.color.text, fontWeight: "800" },
  accBody: { marginTop: 8, color: theme.color.muted, lineHeight: 18, fontSize: 13 },
  accIcon: { color: theme.color.primary, fontSize: 18, fontWeight: "900", paddingLeft: 6 },

  disclaimer: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 6, lineHeight: 16 },
  legal: { color: theme.color.muted, fontSize: 12, textAlign: "center", marginTop: 2 },
});
