import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { theme } from "../app/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  percent,
  label,
  size = 220,
  stroke = 14,
  glow = false,
}: {
  percent: number; // 0..100
  label?: string;
  size?: number;
  stroke?: number;
  glow?: boolean;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const radius = useMemo(() => (size - stroke) / 2, [size, stroke]);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(glow ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: p,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [p, anim]);

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: glow ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [glow, glowAnim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Opacidad del glow cuando está activo
  const glowOpacity1 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });
  const glowOpacity2 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.color.border}
            strokeWidth={stroke}
            fill="transparent"
          />

          {/* glow layers (detrás del progreso) */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.color.primary}
            strokeWidth={stroke + 16}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset as any}
            rotation="-90"
            originX={cx}
            originY={cy}
            opacity={glowOpacity2 as any}
          />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.color.primary}
            strokeWidth={stroke + 8}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset as any}
            rotation="-90"
            originX={cx}
            originY={cy}
            opacity={glowOpacity1 as any}
          />

          {/* progress */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.color.primary}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset as any}
            rotation="-90"
            originX={cx}
            originY={cy}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.center}>
          <Text style={styles.pct}>{Math.round(p)}%</Text>
          {!!label && <Text style={styles.label}>{label}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  center: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pct: { fontSize: 44, fontWeight: "900", color: theme.color.text },
  label: { marginTop: 2, color: theme.color.muted },
});
