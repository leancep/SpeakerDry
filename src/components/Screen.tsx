import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BannerAd } from "react-native-google-mobile-ads";
import { theme } from "../app/theme";
import { useEntitlements } from "../pro/EntitlementsProvider";
import { AdUnit, BannerSize } from "../ads/ads";

export function Screen({
  children,
  scroll = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const ent = useEntitlements();
  const showAds = !ent.isPro;

  // altura “suficiente” para que el contenido no quede debajo del banner
  const bannerPadding = showAds ? 72 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bannerPadding }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexGrow: 1 }}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.container, { paddingBottom: theme.space.lg + bannerPadding }]}>
            <View style={{ flex: 1 }}>{children}</View>
          </View>
        )}

        {/* ✅ Banner fijo abajo (no dentro del scroll) */}
        {showAds && (
          <View style={styles.bannerFooter}>
            <BannerAd unitId={AdUnit.banner} size={BannerSize} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  root: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  container: {
    flex: 1,
    padding: theme.space.lg,
    backgroundColor: theme.color.bg,
    gap: 14,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.space.lg,
    backgroundColor: theme.color.bg,
    gap: 14,
  },
bannerFooter: {
  alignItems: "center",
  paddingTop: 10,
  paddingBottom: 6,
  backgroundColor: theme.color.bg,
  minHeight: 60,
},

  card: {
    backgroundColor: theme.color.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
});
