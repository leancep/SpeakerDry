import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { ErrorCode, useIAP, type Subscription } from "react-native-iap";

type Entitlements = {
  isPro: boolean;
  proLabel: string; // texto para mostrar precio
  canManualUnlimited: boolean;
  canDeepClean: boolean;

  // acciones
  refresh: () => Promise<void>;
  buyPro: () => Promise<void>;
  restore: () => Promise<void>;

  // opcional para dev
  setProDebug: (v: boolean) => void;
};

const Ctx = createContext<Entitlements | null>(null);

// 👇 tu SKU real (mismo en iOS y Android)
const PRO_SKU = "speakerdry_pro_monthly";

function getBestOfferTokens(sub: Subscription) {
  // Android: subscriptionOfferDetailsAndroid trae offerToken. :contentReference[oaicite:2]{index=2}
  const offers = sub.subscriptionOfferDetailsAndroid ?? [];
  return offers.map((o) => ({
    sku: sub.id,
    offerToken: o.offerToken,
  }));
}

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    hasActiveSubscriptions,
    getActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        // En producción: validar receipt en backend antes de conceder PRO.
        // Por ahora: concedemos PRO y finalizamos.
        setIsPro(true);
      } finally {
        await finishTransaction({ purchase, isConsumable: false });
      }
    },
    onPurchaseError: (error) => {
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert("Compra fallida", error.message);
      }
    },
  });

  // 1) cargar producto subscription cuando conecta
  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [PRO_SKU], type: "subs" });
  }, [connected, fetchProducts]);

  // 2) refrescar estado PRO en launch (o cuando conecta)
  async function refresh() {
    try {
      if (!connected) return;
      const active = await hasActiveSubscriptions([PRO_SKU]); // check rápido :contentReference[oaicite:3]{index=3}
      if (active) {
        setIsPro(true);
        return;
      }
      // fallback: lista activa
      const list = await getActiveSubscriptions();
      setIsPro(list.some((p) => p.productId === PRO_SKU));
    } catch {
      // si falla, no rompemos UI
      setIsPro(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const proSub = subscriptions.find((s) => s.id === PRO_SKU);
  const proLabel = useMemo(() => {
    // precio para UI si está disponible
    // iOS: subscription.localizedPrice (depende build), Android: pricingPhases (depende)
    // mantenemos fallback simple:
    return proSub?.displayPrice ?? "Plan mensual";
  }, [proSub]);

  async function buyPro() {
    if (!connected) {
      Alert.alert("Tienda no disponible", "Probá de nuevo en unos segundos.");
      return;
    }
    const sub = subscriptions.find((s) => s.id === PRO_SKU);
    if (!sub) {
      Alert.alert("No disponible", "No se encontró el producto. Revisá el SKU.");
      return;
    }

    await requestPurchase({
      request: {
        apple: { sku: PRO_SKU },
        google: {
          skus: [PRO_SKU],
          subscriptionOffers: Platform.OS === "android" ? getBestOfferTokens(sub) : [],
        },
      },
      type: "subs",
    });
  }

  async function restore() {
    // Para subs normalmente con refresh alcanza, pero dejamos un “Restaurar”:
    await refresh();
    Alert.alert("Listo", isPro ? "PRO activo." : "No se encontró suscripción activa.");
  }

  const value = useMemo<Entitlements>(
    () => ({
      isPro,
      proLabel,
      canManualUnlimited: isPro,
      canDeepClean: isPro,
      refresh,
      buyPro,
      restore,
      setProDebug: (v: boolean) => setIsPro(v),
    }),
    [isPro, proLabel]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEntitlements() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return v;
}
