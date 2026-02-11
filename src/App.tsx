import React, { useEffect } from "react";
import AppNavigator from "./app/AppNavigator";
import { EntitlementsProvider } from "./pro/EntitlementsProvider";
import { initAds, preloadInterstitial } from "./ads/ads";

export default function App() {
  useEffect(() => {
    (async () => {
      await initAds();
      await preloadInterstitial(); // importante para que el “antes de navegar” funcione fluido
    })();
  }, []);
  console.log("APP RENDER");

  return (
    <EntitlementsProvider>
      <AppNavigator />
    </EntitlementsProvider>
  );
}
