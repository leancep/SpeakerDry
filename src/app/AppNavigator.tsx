import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./routes";
import { Pressable, Text } from "react-native";


import HomeScreen from "../screens/HomeScreen";
import CleanScreen from "../screens/CleanScreen";
import ManualScreen from "../screens/ManualScreen";
import PaywallScreen from "../screens/PaywallScreen";
import SettingsScreen from "../screens/SettingsScreen";

import { theme } from "./theme";


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={({ navigation, route }) => ({
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: theme.color.bg },
                    headerTintColor: theme.color.text,
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: theme.color.bg },

                    // ⚙️ solo en Home (recomendado)
                    headerRight: () =>
                        route.name === "Home" ? (
                            <Pressable
                                onPress={() => navigation.navigate("Settings")}
                                style={({ pressed }) => ({
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    opacity: pressed ? 0.7 : 1,
                                })}
                                hitSlop={10}
                            >
                                <Text style={{ color: theme.color.text, fontSize: 18 }}>⚙️</Text>
                            </Pressable>
                        ) : null,
                })}
            >


                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                />
                <Stack.Screen
                    name="Clean"
                    component={CleanScreen}
                    options={{ title: "Limpiando…" }}
                />
                <Stack.Screen
                    name="Manual"
                    component={ManualScreen}
                    options={{ title: "Manual Hz" }}
                />
                <Stack.Screen
                    name="Paywall"
                    component={PaywallScreen}
                    options={{ presentation: "modal", title: "" }}
                />

                <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Ajustes" }} />

            </Stack.Navigator>
        </NavigationContainer>
    );
}
