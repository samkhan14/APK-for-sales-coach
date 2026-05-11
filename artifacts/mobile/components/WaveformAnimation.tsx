import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  isActive: boolean;
  barCount?: number;
  color?: string;
}

export function WaveformAnimation({ isActive, barCount = 5, color }: Props) {
  const colors = useColors();
  const barColor = color || colors.waveform;
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isActive) {
      const anims = animations.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 80),
            Animated.timing(anim, { toValue: 1, duration: 300 + i * 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.25, duration: 300 + i * 50, useNativeDriver: true }),
          ])
        )
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      animations.forEach(anim => {
        Animated.timing(anim, { toValue: 0.3, duration: 200, useNativeDriver: true }).start();
      });
    }
  }, [isActive, animations]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: barColor, transform: [{ scaleY: anim }] }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
  },
  bar: {
    width: 4,
    height: 32,
    borderRadius: 3,
  },
});
