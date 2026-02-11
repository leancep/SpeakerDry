// src/ads/ads.ts
import mobileAds, {
  InterstitialAd,
  AdEventType,
  TestIds,
  BannerAdSize,
} from "react-native-google-mobile-ads";

export const BannerSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

export const AdUnit = {
  banner: __DEV__ ? TestIds.BANNER : "ca-app-pub-8105951429733230/2446761288",
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : "ca-app-pub-8105951429733230/7523828142",
};

export type AdReason = "after_action" | "other";

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

// Robustez global
let showLock = false;
let lastInterstitialAt = 0;
let lastLoadAttemptAt = 0;

export const INTERSTITIAL_COOLDOWN_MS = 45_000;

// UX caps (recomendado)
const appStartAt = Date.now();
const GRACE_PERIOD_MS = 20_000; // no mostrar en los primeros 20s
let sessionShowCount = 0;
const SESSION_MAX_INTERSTITIALS = 6;

function log(...args: any[]) {
  if (__DEV__) console.log("[ADS]", ...args);
}

export async function initAds() {
  await mobileAds().initialize();
  log("mobileAds initialized");
}

/** Crea (si no existe) y asegura que esté cargando/cargado */
export async function preloadInterstitial() {
  if (!interstitial) {
    interstitialLoaded = false;

    interstitial = InterstitialAd.createForAdRequest(AdUnit.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
      log("interstitial LOADED");
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      showLock = false;
      lastInterstitialAt = Date.now(); // cooldown al cerrar
      log("interstitial CLOSED → cooldown start");
      safeLoad("closed");
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
      interstitialLoaded = false;
      showLock = false;
      log("interstitial ERROR", err?.message ?? err);
      safeLoad("error");
    });

    log("interstitial created");
  }

  safeLoad("preload_call");
}

function canShowByCooldown() {
  return Date.now() - lastInterstitialAt >= INTERSTITIAL_COOLDOWN_MS;
}

function canShowBySessionCaps() {
  if (Date.now() - appStartAt < GRACE_PERIOD_MS) return false;
  if (sessionShowCount >= SESSION_MAX_INTERSTITIALS) return false;
  return true;
}

function safeLoad(source: string) {
  if (!interstitial) return;
  if (interstitialLoaded) return;

  const now = Date.now();
  if (now - lastLoadAttemptAt < 1500) return;
  lastLoadAttemptAt = now;

  log("interstitial load()", source);
  try {
    interstitial.load();
  } catch {
    log("interstitial load() failed", source);
  }
}

/**
 * ✅ Bloqueante (espera CLOSED/ERROR) para evitar crash al navegar.
 * - respeta lock + cooldown + caps
 * - si no está loaded: no bloquea, intenta cargar
 */
export async function showInterstitialBlocking(
  reason: AdReason = "other"
): Promise<boolean> {
  if (!interstitial) {
    await preloadInterstitial();
    return false;
  }

  if (showLock) return false;

  if (!interstitialLoaded) {
    safeLoad("showBlocking_not_loaded");
    return false;
  }

  if (!canShowByCooldown()) return false;
  if (!canShowBySessionCaps()) return false;

  showLock = true;
  sessionShowCount += 1;

  log("showBlocking", reason, "→ SHOW");

  return new Promise<boolean>((resolve) => {
    let settled = false;

    // ✅ declaramos primero para poder limpiar seguro
    let offClosed: (() => void) | undefined;
    let offError: (() => void) | undefined;

    const cleanup = () => {
      try { offClosed?.(); } catch {}
      try { offError?.(); } catch {}
    };

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    // Estos listeners son "one-shot" para *este* show.
    offClosed = interstitial!.addAdEventListener(AdEventType.CLOSED, () => done(true));
    offError = interstitial!.addAdEventListener(AdEventType.ERROR, () => done(false));

    try {
      interstitial!.show();
    } catch {
      // si explota show(), liberamos y recargamos best-effort
      showLock = false;
      interstitialLoaded = false;
      safeLoad("showBlocking_failed");
      done(false);
    }
  });
}
