import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { SalesScenario } from "@/constants/database";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface Props {
  scenario: SalesScenario;
  onPress: () => void;
  selected?: boolean;
}

const DIFFICULTY_COLORS = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

export function ScenarioCard({ scenario, onPress, selected }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.accent : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        }
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
        <Feather name={scenario.icon as FeatherIconName} size={20} color={selected ? "#fff" : colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{scenario.title}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={1}>
          {scenario.description}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLORS[scenario.difficulty] + "20" }]}>
            <Text style={[styles.badgeText, { color: DIFFICULTY_COLORS[scenario.difficulty] }]}>
              {scenario.difficulty.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.industry, { color: colors.mutedForeground }]}>{scenario.industry}</Text>
        </View>
      </View>
      {selected && (
        <Feather name="check-circle" size={20} color={colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 12 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  industry: { fontSize: 11 },
});
