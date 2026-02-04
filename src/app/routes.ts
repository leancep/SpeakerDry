export type RootStackParamList = {
  Home: undefined;
  Clean: { mode: "quick" | "deep" };
  Manual: undefined;
  Paywall: { source?: "home" | "deep-clean" | "manual" } | undefined;
  Settings: undefined;
};
