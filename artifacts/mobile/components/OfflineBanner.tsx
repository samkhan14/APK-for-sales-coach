// I13: shows a clear banner when the phone has no internet (AI calls, scoring and translation need it).
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNetworkState } from "expo-network";

export function isOffline(state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function OfflineBanner({ message = "You're offline. The AI customer and scoring need internet." }: { message?: string }) {
  const state = useNetworkState();
  if (!isOffline(state)) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Feather name="wifi-off" size={14} color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#b45309", paddingHorizontal: 14, paddingVertical: 8 },
  text: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
});
