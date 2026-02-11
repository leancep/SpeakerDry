// src/ads/navAfterAd.ts
import { InteractionManager } from "react-native";

export async function waitForUiSettled() {
  // Espera a que termine la cola de interacciones/animaciones
  await new Promise<void>((resolve) =>
    InteractionManager.runAfterInteractions(() => resolve())
  );

  // + 1 frame (a veces 2 ayuda más)
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
