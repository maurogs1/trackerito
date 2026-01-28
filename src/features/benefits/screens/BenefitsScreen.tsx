import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { BANKS, BENEFITS, formatBenefitDays } from '../mockBenefits';
import { CardBrand, CardLevel } from '../types';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function BenefitsScreen() {
  const { preferences, userBanks, toggleUserBank, updateUserBank } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  const isBankSelected = (bankId: string) => userBanks.some(b => b.bankId === bankId);
  const getUserBank = (bankId: string) => userBanks.find(b => b.bankId === bankId);

  const handleToggleBank = (bankId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isBankSelected(bankId)) {
      setExpandedBank(expandedBank === bankId ? null : bankId);
    } else {
      toggleUserBank(bankId);
      setExpandedBank(bankId);
    }
  };

  const handleCheckboxPress = (bankId: string) => toggleUserBank(bankId);

  const handleUpdateCard = (bankId: string, brand: CardBrand, level: CardLevel) => {
    const userBank = getUserBank(bankId);
    if (userBank) {
      updateUserBank(bankId, [{ brand, level }]);
    }
  };

  const styles = StyleSheet.create({
    bankCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    bankCardSelected: {
      borderColor: currentTheme.primary,
      backgroundColor: currentTheme.primary + '05',
    },
    bankHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
    },
    configSection: {
      padding: spacing.lg,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
    },
    configLabel: {
      ...typography.captionBold,
      color: currentTheme.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    benefitsList: {
      marginTop: spacing.lg,
    },
    benefitItem: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    benefitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    benefitMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    benefitDay: {
      ...typography.caption,
      color: currentTheme.textSecondary,
      backgroundColor: currentTheme.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    benefitBrand: {
      ...typography.small,
      fontWeight: 'bold',
      color: '#FFF',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
  });

  return (
    <ScrollView
      style={common.screenContainer}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.md }}
    >
      <View style={common.screenHeader}>
        <Text style={[typography.title, { color: currentTheme.text, marginBottom: spacing.xs }]}>
          Mis Beneficios
        </Text>
        <Text style={[typography.subtitle, { color: currentTheme.textSecondary }]}>
          Configura tus tarjetas para ver descuentos exclusivos.
        </Text>
      </View>

      <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg, marginTop: spacing.xxl }]}>
        Bancos Disponibles
      </Text>

      {BANKS.map((bank) => {
        const selected = isBankSelected(bank.id);
        const userBank = getUserBank(bank.id);
        const currentCard = userBank?.cards[0] || { brand: 'visa', level: 'classic' };
        const isExpanded = expandedBank === bank.id;

        return (
          <View key={bank.id} style={[styles.bankCard, selected && styles.bankCardSelected]}>
            <TouchableOpacity style={styles.bankHeader} onPress={() => handleToggleBank(bank.id)}>
              <View style={[common.iconContainer, { backgroundColor: bank.color, marginRight: spacing.lg }]}>
                <Ionicons name={bank.logo as any} size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{bank.name}</Text>
                <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                  {selected ? `${currentCard.brand.toUpperCase()} ${currentCard.level.toUpperCase()}` : 'Tocar para conectar'}
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleCheckboxPress(bank.id)} style={{ padding: spacing.sm }}>
                <Ionicons
                  name={selected ? "checkbox" : "square-outline"}
                  size={24}
                  color={selected ? currentTheme.primary : currentTheme.textSecondary}
                />
              </TouchableOpacity>

              {selected && (
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={currentTheme.textSecondary}
                  style={{ marginLeft: spacing.md }}
                />
              )}
            </TouchableOpacity>

            {selected && isExpanded && (
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>Marca</Text>
                <View style={styles.chipContainer}>
                  {(['visa', 'mastercard', 'amex'] as CardBrand[]).map(brand => (
                    <TouchableOpacity
                      key={brand}
                      style={[common.chip, currentCard.brand === brand && common.chipSelected]}
                      onPress={() => handleUpdateCard(bank.id, brand, currentCard.level)}
                    >
                      <Text style={[common.chipText, currentCard.brand === brand && common.chipTextSelected]}>
                        {brand.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.configLabel}>Nivel</Text>
                <View style={styles.chipContainer}>
                  {(['classic', 'gold', 'platinum', 'black'] as CardLevel[]).map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[common.chip, currentCard.level === level && common.chipSelected]}
                      onPress={() => handleUpdateCard(bank.id, currentCard.brand, level)}
                    >
                      <Text style={[common.chipText, currentCard.level === level && common.chipTextSelected]}>
                        {level.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.configLabel}>Beneficios Disponibles</Text>
                <View style={styles.benefitsList}>
                  {BENEFITS.filter(b => b.bankId === bank.id).map(b => (
                    <View key={b.id} style={styles.benefitItem}>
                      <View style={styles.benefitHeader}>
                        <Text style={[typography.bodyBold, { color: currentTheme.text, flex: 1 }]}>
                          {b.description}
                        </Text>
                        <Text style={[typography.bodyBold, { color: currentTheme.success }]}>
                          {b.discountPercentage}%
                        </Text>
                      </View>
                      <View style={styles.benefitMeta}>
                        <Text style={styles.benefitDay}>{formatBenefitDays(b.days)}</Text>
                        <Text style={[styles.benefitBrand, { backgroundColor: currentCard.brand === 'visa' ? '#1A1F71' : '#EB001B' }]}>
                          {currentCard.brand.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
