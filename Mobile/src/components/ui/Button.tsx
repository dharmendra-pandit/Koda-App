import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../styles/colors';
import { Shadows } from '../../styles/shadows';
import { BorderRadius, Spacing } from '../../styles/spacing';
import { FontSize, FontWeight } from '../../styles/typography';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, textStyle, icon, fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); };

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant] as ViewStyle,
    styles[`size_${size}`] as ViewStyle,
    fullWidth ? { alignSelf: 'stretch' as const } : {},
    disabled || loading ? styles.disabled : {},
    style,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.text,
    styles[`text_${variant}`] as TextStyle,
    styles[`textSize_${size}`] as TextStyle,
    textStyle,
  ];

  return (
    <Animated.View style={[animatedStyle, fullWidth ? { alignSelf: 'stretch' } : {}]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={buttonStyles}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} size="small" />
        ) : (
          <>
            {icon && icon}
            <Text style={textStyles}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: BorderRadius.lg,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.green,
  },
  secondary: {
    backgroundColor: Colors.backgroundAlt,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.primary },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  size_md: { paddingHorizontal: Spacing.xl, paddingVertical: 13 },
  size_lg: { paddingHorizontal: Spacing.xxl, paddingVertical: 16 },
  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.base },
  textSize_lg: { fontSize: FontSize.md },
});
