import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '../../styles/colors';
import { BorderRadius } from '../../styles/spacing';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress, color = Colors.primary, backgroundColor = Colors.border,
  height = 6, style, animated = true,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      width.value = withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 800,
        easing: Easing.out(Easing.exp),
      });
    } else {
      width.value = Math.min(Math.max(progress, 0), 1);
    }
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[{ height, backgroundColor, borderRadius: BorderRadius.full, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height, backgroundColor: color, borderRadius: BorderRadius.full }, animStyle]} />
    </View>
  );
};
