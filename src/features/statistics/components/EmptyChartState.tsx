import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../../shared/theme';
import { Theme } from '../../../shared/theme';

interface EmptyChartStateProps {
  currentTheme: Theme;
  message?: string;
}

export default function EmptyChartState({ currentTheme, message }: EmptyChartStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="analytics-outline" size={64} color={currentTheme.textSecondary} />
      <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.lg, textAlign: 'center' }]}>
        {message || 'No hay datos para el período seleccionado'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
});
