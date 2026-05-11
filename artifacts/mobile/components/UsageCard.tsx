import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Status = "active" | "warning" | "exhausted" | "standby";

interface Props {
  provider: string;
  used: number;
  limit: number;
  status: Status;
  isCurrent: boolean;
  resetIn?: string;
  subtitle?: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  active: { label: "ACTIVE", color: "#22c55e", dot: "#22c55e" },
  warning: { label: "NEARING LIMIT", color: "#f59e0b", dot: "#f59e0b" },
  exhausted: { label: "EXHAUSTED", color: "#ef4444", dot: "#ef4444" },
  standby: { label: "STANDBY", color: "#94a3b8", dot: "#94a3b8" },
};

export function UsageCard({ provider, used, limit, status, isCurrent, resetIn, subtitle }: Props) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[status];
  const pct = Math.min((used / limit) * 100, 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: isCurrent ? colors.primary : colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.name, { color: colors.foreground }]}>{provider}</Text>
          {isCurrent && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.currentText, { color: colors.primary }]}>IN USE</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + "20" }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      )}

      <View style={styles.usageRow}>
        <Text style={[styles.usageText, { color: colors.foreground }]}>
          {used.toLocaleString()} <Text style={{ color: colors.mutedForeground }}>/ {limit.toLocaleString()} req</Text>
        </Text>
        <Text style={[styles.pctText, { color: cfg.color }]}>{Math.round(pct)}%</Text>
      </View>

      <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
      </View>

      {resetIn && (
        <Text style={[styles.reset, { color: colors.mutedForeground }]}>Resets in {resetIn}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 10, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 16, fontWeight: "700" },
  currentBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  currentText: { fontSize: 10, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  usageText: { fontSize: 14, fontWeight: "500" },
  pctText: { fontSize: 13, fontWeight: "600" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  reset: { fontSize: 12 },
});
