import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ConfirmConfig } from '../hooks/useConfirm';
import { theme, typography, spacing, borderRadius } from '../theme';

interface ConfirmModalProps {
  config: ConfirmConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}

export default function ConfirmModal({ config, onConfirm, onCancel, isDark }: ConfirmModalProps) {
  const currentTheme = isDark ? theme.dark : theme.light;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    card: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    title: {
      ...typography.sectionTitle,
      color: currentTheme.text,
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.body,
      color: currentTheme.textSecondary,
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
    cancelBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    confirmBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: currentTheme.primary,
    },
    confirmBtnDestructive: {
      backgroundColor: currentTheme.error,
    },
  });

  return (
    <Modal visible={!!config} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{config?.title}</Text>
          <Text style={styles.message}>{config?.message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={[typography.body, { color: currentTheme.textSecondary }]}>
                {config?.cancelText ?? 'Cancelar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, config?.destructive && styles.confirmBtnDestructive]}
              onPress={onConfirm}
            >
              <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                {config?.confirmText ?? 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
