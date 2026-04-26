import React from 'react';
import { TouchableOpacity, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../styles/colors';
import { Shadows } from '../../styles/shadows';
import { BorderRadius, Spacing } from '../../styles/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  shadow?: 'none' | 'sm' | 'md' | 'card';
  padding?: number;
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  children, style, onPress, shadow = 'card', padding = Spacing.cardPadding, radius = BorderRadius.lg,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.98, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

  const cardStyle = [
    styles.card,
    Shadows[shadow] as ViewStyle,
    { padding, borderRadius: radius },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={cardStyle}
          activeOpacity={0.95}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={[cardStyle, animatedStyle]}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
