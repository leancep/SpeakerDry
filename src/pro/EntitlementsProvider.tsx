import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorCode, useIAP, type Subscription } from "react-native-iap";

type Entitlements = {
  isPro: boolean;
  proLabel: string;
  canManualUnlimited: boolean;
  canDeepClean: boolean;

  refresh: () => Promise<void>;
  buyPro: () => Promise<void>;
  restore: () => Promise<void>;

  setProDebug: (v: boolean) => Promise<void>;
};

const Ctx = createContext<Entitlements | null>(null);

const PRO_SKU = "speakerdry_pro_monthly";
const DEV_PRO_KEY = "dev_is_pro";

// En dev con applicationIdSuffix ".debug" NO hay billing real (package no coincide con Play Console).
const IAP_ENABLED = !__DEV__ && Platform.OS === "android";

function getBestOfferTokens(sub: Subscription) {
  const offers = sub.subscriptionOfferDetailsAndroid ?? [];
  return offers.map((o) => ({ sku: sub.id, offerToken: o.offerToken }));
}

/** Provider “NOOP”: no toca IAP, no inicializa nada */
function EntitlementsProviderNoop({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(DEV_PRO_KEY);
        if (v === "1") setIsPro(true);
      } catch {}
    })();
  }, []);

  const setProDebug = async (v: boolean) => {
    setIsPro(v);
    try {
      await AsyncStorage.setItem(DEV_PRO_KEY, v ? "1" : "0");
    } catch {}
  };

  const value = useMemo(
    () => ({
      isPro,
      proLabel: "US$ 3,00",
      canManualUnlimited: isPro,
      canDeepClean: isPro,

      refresh: async () => {},

      // ✅ En DEV: el botón del paywall ofrece un toggle PRO
      buyPro: async () => {
        await setProDebug(!isPro);
        Alert.alert("PRO (DEV)", !isPro ? "PRO activado." : "PRO desactivado.");
      },

      restore: async () => {
        Alert.alert("Restaurar (DEV)", isPro ? "PRO activo." : "No hay PRO activo.");
      },

      setProDebug,
    }),
    [isPro]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Provider REAL: usa react-native-iap */
function EntitlementsProviderIap({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [PRO_SKU], type: "subs" });
  }, [connected, fetchProducts]);

  async function refresh() {
    try {
      if (!connected) return;

      const active = await hasActiveSubscriptions([PRO_SKU]);
      if (active) {
        setIsPro(true);
        return;
      }

      const list = await getActiveSubscriptions();
      setIsPro(list.some((p) => p.productId === PRO_SKU));
    } catch {
      setIsPro(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const proSub = subscriptions.find((s) => s.id === PRO_SKU);
  const proLabel = useMemo(() => proSub?.displayPrice ?? "US$ 3,00", [proSub]);

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

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  // ⭐ clave: en dev NO montamos el provider que llama useIAP()
  if (!IAP_ENABLED) return <EntitlementsProviderNoop>{children}</EntitlementsProviderNoop>;
  return <EntitlementsProviderIap>{children}</EntitlementsProviderIap>;
}

export function useEntitlements() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return v;
}
