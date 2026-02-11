import { useCallback } from "react";
import { showInterstitialBlocking } from "./ads";
import { useEntitlements } from "../pro/EntitlementsProvider";

export function useActionAd() {
  const ent = useEntitlements();

  const showActionEndAd = useCallback(async () => {
    if (ent.isPro) return;
    try {
      await showInterstitialBlocking("after_action");
    } catch {}
  }, [ent.isPro]);

  return { showActionEndAd };
}
