import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '../../styles/colors';
import { BorderRadius } from '../../styles/spacing';
import { FontSize, FontWeight } from '../../styles/typography';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  glow?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48, glow = false, style }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );

  if (glow) {
    return (
      <MotiView
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ type: 'timing', duration: 2200, loop: true }}
        style={[
          { borderRadius: size / 2, padding: 3, backgroundColor: Colors.glassDark },
          style,
        ]}
      >
        {inner}
      </MotiView>
    );
  }

  return <View style={[{ borderRadius: size / 2 }, style]}>{inner}</View>;
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.glassDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  initials: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
