import React from "react";
import AppNavigator from "./app/AppNavigator";
import { EntitlementsProvider } from "./pro/EntitlementsProvider";

export default function App() {
  return (
    <EntitlementsProvider>
      <AppNavigator />
    </EntitlementsProvider>
  );
}
