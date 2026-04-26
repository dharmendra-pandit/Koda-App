import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../styles/colors';
import { BorderRadius, Spacing } from '../../styles/spacing';
import { FontSize, FontWeight } from '../../styles/typography';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label, color = Colors.glassDark, textColor = Colors.primary,
  style, textStyle, size = 'md',
}) => {
  return (
    <View style={[styles.badge, styles[size], { backgroundColor: color }, style]}>
      <Text style={[styles.text, styles[`text_${size}`], { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  text_sm: { fontSize: FontSize.xs },
  text_md: { fontSize: FontSize.sm },
});
