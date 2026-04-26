import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../styles/colors';
import { BorderRadius, Spacing } from '../../styles/spacing';
import { FontSize, FontWeight } from '../../styles/typography';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  autoCorrect?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  keyboardType = 'default', autoCapitalize = 'sentences', error,
  leftIcon, rightIcon, style, inputStyle, multiline = false,
  numberOfLines, editable = true, autoCorrect = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : {}, !editable ? styles.inputDisabled : {}]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : {}, rightIcon ? styles.inputWithRightIcon : {}, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCorrect={autoCorrect}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputError: { borderColor: Colors.error },
  inputDisabled: { backgroundColor: Colors.backgroundAlt, opacity: 0.7 },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
  },
  inputWithLeftIcon: { paddingLeft: 8 },
  inputWithRightIcon: { paddingRight: 8 },
  iconLeft: { paddingLeft: Spacing.md },
  iconRight: { paddingRight: Spacing.md },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 2,
  },
});
