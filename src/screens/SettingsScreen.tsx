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
import { Screen, Card } from "../components/Screen";
import { theme } from "../app/theme";
import PrimaryButton from "../components/PrimaryButton";
import ProBadge from "../components/ProBadge";
import { useEntitlements } from "../pro/EntitlementsProvider";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Item = { q: string; a: string };

function AccordionItem({
  q,
  a,
  isOpen,
  onToggle,
  numberOfLines = 2,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  numberOfLines?: number;
}) {
  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
      }}
      style={({ pressed }) => [styles.accRow, { opacity: pressed ? 0.85 : 1 }]}
      hitSlop={10}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.accQ} numberOfLines={numberOfLines}>
          {q}
        </Text>
        {isOpen && <Text style={styles.accA}>{a}</Text>}
      </View>
      <Text style={styles.accIcon}>{isOpen ? "−" : "+"}</Text>
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const ent = useEntitlements();

  // Separate state for FAQs and Legal (so opening one doesn't close the other)
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openLegal, setOpenLegal] = useState<number | null>(null);

  const faqs: Item[] = useMemo(
    () => [
      {
        q: "Does SpeakerDry really remove water from the speaker?",
        a:
          "SpeakerDry plays tuned sound waves that create vibration in the speaker grill. This vibration may help push out trapped water droplets and loose debris. Results vary by device model and the amount of water/dust.",
      },
      {
        q: "My speaker sounds muffled — what should I do first?",
        a:
          "Start with Quick Water Eject (30s). Set system volume to max and keep the speaker facing down. If it’s still muffled, try Deep Speaker Clean (2 min) and then Manual Hz for 5–10 seconds per frequency.",
      },
      {
        q: "Which frequency should I use in Manual Hz?",
        a:
          "Choose the frequency with the strongest vibration on your device. Test each one for 5–10 seconds. Stronger vibration often improves water ejection on that phone model.",
      },
      {
        q: "Why do you recommend ‘speaker facing down’?",
        a:
          "Gravity helps water move outward while vibration pushes droplets from the grill. Facing the speaker down usually improves the chances of ejecting water.",
      },
      {
        q: "Do I need PRO to clean my speaker?",
        a:
          "FREE includes Quick mode and a limited Manual Hz range. PRO unlocks Deep Clean, the full frequency range (200–3000 Hz), and removes ads.",
      },
      {
        q: "Can this fix hardware damage?",
        a:
          "No. SpeakerDry uses audio vibration and does not repair hardware, corrosion, or internal damage. If your device had heavy liquid exposure or sound remains distorted, consider professional service.",
      },
    ],
    []
  );

  // Legal copy optimized to avoid risky claims:
  // - No guarantees
  // - Not medical / not repair tool
  // - Not “fix” promises, use “may help”
  const privacyPolicy = useMemo(
    () =>
      [
        "SpeakerDry Privacy Policy",
        "",
        "SpeakerDry is designed to work locally on your device and does not require account registration.",
        "",
        "Data collection",
        "• SpeakerDry does not require name, email, phone number, or login.",
        "• We do not collect personal identifiable information (PII) within the app.",
        "",
        "Audio usage",
        "• SpeakerDry plays sound frequencies through your device speakers to create vibration effects.",
        "• SpeakerDry does not record audio and does not access your microphone.",
        "",
        "Advertising (FREE version)",
        "• The free version may display ads provided by third-party advertising networks.",
        "• These providers may collect device identifiers and anonymous usage data according to their own policies.",
        "",
        "Subscriptions (PRO)",
        "• Payments are processed securely by Google Play.",
        "• SpeakerDry does not store your payment information.",
        "",
        "Analytics",
        "• We may use anonymous, aggregated analytics (e.g., crashes/performance) to improve stability.",
        "",
        "Contact",
        "• If you have privacy questions: speakerdry@gmail.com",
      ].join("\n"),
    []
  );

  const termsOfService = useMemo(
    () =>
      [
        "SpeakerDry Terms of Service",
        "",
        "SpeakerDry is a utility app that generates sound vibrations intended to help eject water or loose debris from device speaker grills.",
        "",
        "No guarantee",
        "• Results may vary depending on device model and condition.",
        "• SpeakerDry does not repair hardware damage, corrosion, or internal liquid exposure.",
        "",
        "Safe use",
        "• Use at a safe volume level and stop if you feel discomfort.",
        "• Keep the device speaker facing down when possible.",
        "",
        "Limitations",
        "• SpeakerDry is not a professional repair tool and does not replace technical service.",
        "• If your device suffered significant liquid exposure, seek professional inspection.",
        "",
        "Subscriptions",
        "• PRO features are optional and billed through Google Play.",
        "• You can cancel anytime from your Google Play subscription settings.",
        "",
        "Liability",
        "• To the fullest extent permitted by law, the developer is not responsible for device damage or data loss resulting from improper use.",
        "",
        "By using SpeakerDry, you agree to these terms.",
      ].join("\n"),
    []
  );

  const disclaimer = useMemo(
    () =>
      [
        "Disclaimer",
        "",
        "SpeakerDry plays audio vibration patterns that may help eject water and loose debris from the speaker grill.",
        "It does not guarantee results and does not fix hardware damage, corrosion, or internal liquid exposure.",
        "",
        "If your device was exposed to significant liquid, turn it off and consider professional service.",
        "Use the app at a safe volume level and stop if you feel discomfort.",
      ].join("\n"),
    []
  );

  const legalItems: Item[] = useMemo(
    () => [
      { q: "🔒 Privacy Policy", a: privacyPolicy },
      { q: "📄 Terms of Service", a: termsOfService },
      { q: "⚠️ Disclaimer", a: disclaimer },
    ],
    [privacyPolicy, termsOfService, disclaimer]
  );

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <Text style={styles.subtitle}>Info, PRO status, help, and legal.</Text>
      </View>

      {/* STATUS */}
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.h}>Status</Text>
          {ent.isPro ? <ProBadge text="PRO" variant="active" /> : <ProBadge text="FREE" variant="pro" />}
        </View>

        <Text style={styles.p}>
          {ent.isPro
            ? "PRO is enabled. Deep Clean and the full frequency range are available."
            : "You’re on FREE. Deep Clean and advanced frequencies unlock with PRO."}
        </Text>

        <PrimaryButton
          label={ent.isPro ? "View PRO benefits" : "Unlock PRO"}
          variant="secondary"
          onPress={() => navigation.navigate("Paywall", { source: "settings" })}
        />

      </Card>

      {/* ABOUT */}
      <Card style={{ gap: 10 }}>
        <Text style={styles.h}>About</Text>
        <Text style={styles.p}>
          SpeakerDry is a sound-based speaker cleaner designed to help eject water and dust using carefully tuned
          vibration frequencies.{"\n\n"}
          If your phone speaker sounds muffled after water exposure, humidity, or dust buildup, SpeakerDry may help
          restore clearer sound.{"\n\n"}
          Note: This app uses audio vibration and does not repair hardware damage.
        </Text>
        <Text style={styles.pSmall}>Works locally · no sign-up required</Text>
        <Text style={styles.pSmall}>Version: 0.1.0</Text>
      </Card>

      {/* FAQs */}
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.h}>Help & FAQs</Text>
          <Text style={styles.pSmall}>Tap to expand</Text>
        </View>

        <View style={styles.accWrap}>
          {faqs.map((item, idx) => (
            <AccordionItem
              key={`faq-${idx}`}
              q={item.q}
              a={item.a}
              isOpen={openFaq === idx}
              onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
            />
          ))}
        </View>
      </Card>

      {/* LEGAL (accordion, no links) */}
      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Text style={styles.h}>Legal</Text>
          <Text style={styles.pSmall}>Tap to expand</Text>
        </View>

        <Text style={styles.p}>
          SpeakerDry is a utility app that plays audio vibration patterns. It is not a repair tool and does not
          guarantee results.
        </Text>

        <View style={styles.accWrap}>
          {legalItems.map((item, idx) => (
            <AccordionItem
              key={`legal-${idx}`}
              q={item.q}
              a={item.a}
              isOpen={openLegal === idx}
              onToggle={() => setOpenLegal(openLegal === idx ? null : idx)}
              numberOfLines={1}
            />
          ))}
        </View>
      </Card>

      {/* DEV */}
      {__DEV__ && (
        <Card style={{ gap: 10 }}>
          <Text style={styles.h}>Dev tools</Text>

          <PrimaryButton
            label={ent.isPro ? "✅ PRO active (tap to disable)" : "🔓 Enable PRO (DEV)"}
            variant="secondary"
            onPress={() => ent.setProDebug(!ent.isPro)}
          />

          <Text style={styles.pSmall}>Dev-only. Persists on the device.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: theme.color.muted, textAlign: "center" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontSize: 16, fontWeight: "900", color: theme.color.text },
  p: { color: theme.color.muted, lineHeight: 18 },
  pSmall: { color: theme.color.muted, fontSize: 12, lineHeight: 16 },

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
  accQ: { color: theme.color.text, fontWeight: "800", lineHeight: 18 },
  accA: {
    marginTop: 8,
    color: theme.color.muted,
    lineHeight: 18,
    fontSize: 13,
    // helps long legal text readability
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: undefined }) as any,
  },
  accIcon: { color: theme.color.primary, fontSize: 18, fontWeight: "900", paddingLeft: 6 },
});
