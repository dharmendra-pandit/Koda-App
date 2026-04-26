import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { CheckCircle2, AlertCircle, Info, HelpCircle, XCircle } from 'lucide-react-native';
import { useAlertStore, AlertType } from '../../store/useAlertStore';
import { Colors } from '../../styles/colors';
import { Spacing, BorderRadius } from '../../styles/spacing';
import { FontSize, FontWeight } from '../../styles/typography';
import { Shadows } from '../../styles/shadows';

const { width } = Dimensions.get('window');

const getIcon = (type: AlertType, color: string) => {
  const size = 32;
  switch (type) {
    case 'success': return <CheckCircle2 size={size} color={color} />;
    case 'error': return <XCircle size={size} color={color} />;
    case 'warning': return <AlertCircle size={size} color={color} />;
    case 'confirm': return <HelpCircle size={size} color={color} />;
    default: return <Info size={size} color={color} />;
  }
};

const getTypeColor = (type: AlertType) => {
  switch (type) {
    case 'success': return Colors.success;
    case 'error': return Colors.error;
    case 'warning': return Colors.warning;
    case 'confirm': return Colors.primary;
    default: return Colors.primary;
  }
};

export const CustomAlert = () => {
  const { visible, title, message, type, actions, icon, hideAlert } = useAlertStore();

  if (!visible) return null;

  const mainColor = getTypeColor(type);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={hideAlert}>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 200 }}
          style={StyleSheet.absoluteFill}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={hideAlert} 
            style={styles.backdrop} 
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.container}
        >
          <View style={[styles.iconContainer, { backgroundColor: mainColor + '15' }]}>
            {icon || getIcon(type, mainColor)}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {actions.map((action, index) => {
              const isCancel = action.style === 'cancel';
              const isDestructive = action.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    hideAlert();
                    action.onPress?.();
                  }}
                  style={[
                    styles.button,
                    index > 0 && styles.buttonMargin,
                    isCancel && styles.cancelButton,
                    isDestructive && styles.destructiveButton,
                    !isCancel && !isDestructive && { backgroundColor: mainColor },
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel && styles.cancelButtonText,
                    isDestructive && styles.destructiveButtonText,
                    !isCancel && !isDestructive && { color: Colors.white },
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    width: width * 0.85,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg as any,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm as any,
  },
  buttonMargin: {
    // marginTop: 8,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
  },
  destructiveButton: {
    backgroundColor: Colors.error + '10',
    borderWidth: 1.5,
    borderColor: Colors.error,
    elevation: 0,
    shadowOpacity: 0,
  },
  destructiveButtonText: {
    color: Colors.error,
  },
});
