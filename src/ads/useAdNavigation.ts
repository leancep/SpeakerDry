import { useCallback } from "react";
import type { NavigationProp } from "@react-navigation/native";
//import { tryShowInterstitial } from "./ads";
import { useEntitlements } from "../pro/EntitlementsProvider";

export function useAdNavigation() {
  const ent = useEntitlements();

  const navigateWithAd = useCallback(
    async <Params extends object | undefined = undefined>(
      navigation: NavigationProp<any>,
      screen: string,
      params?: Params
    ) => {
      if (!ent.isPro) {
        try {
            console.log("Flujo viejo");
          //await tryShowInterstitial("before_navigation");
        } catch {}
      }
      navigation.navigate(screen as never, params as never);
    },
    [ent.isPro]
  );

  return { navigateWithAd };
}
