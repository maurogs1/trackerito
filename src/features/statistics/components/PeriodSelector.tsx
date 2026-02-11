import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Theme } from '../../../shared/theme';
import { PeriodType } from '../hooks/useStatisticsData';

interface PeriodSelectorProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
  onCustomRange: () => void;
  currentTheme: Theme;
}

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'this_month', label: 'Este mes' },
  { key: 'last_month', label: 'Mes anterior' },
  { key: 'custom', label: 'Personalizado' },
];

export default function PeriodSelector({ selected, onSelect, onCustomRange, currentTheme }: PeriodSelectorProps) {
  const handlePress = (key: PeriodType) => {
    if (key === 'custom') {
      onCustomRange();
    }
    onSelect(key);
  };

  return (
    <View style={styles.container}>
      {PERIODS.map((period) => {
        const isActive = selected === period.key;
        return (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? currentTheme.primary : 'transparent',
                borderColor: isActive ? currentTheme.primary : currentTheme.border,
              },
            ]}
            onPress={() => handlePress(period.key)}
            activeOpacity={0.7}
          >
            {period.key === 'custom' && (
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isActive ? '#FFF' : currentTheme.textSecondary}
                style={{ marginRight: spacing.xs }}
              />
            )}
            <Text
              style={[
                typography.caption,
                {
                  color: isActive ? '#FFF' : currentTheme.textSecondary,
                  fontWeight: isActive ? '600' : 'normal',
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
});
