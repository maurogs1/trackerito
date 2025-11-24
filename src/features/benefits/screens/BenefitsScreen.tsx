import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { BANKS, BENEFITS, formatBenefitDays } from '../mockBenefits';
import { Bank, CardBrand, CardLevel } from '../types';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function BenefitsScreen() {
  const { preferences, userBanks, toggleUserBank, updateUserBank } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  const isBankSelected = (bankId: string) => {
    return userBanks.some(b => b.bankId === bankId);
  };

  const getUserBank = (bankId: string) => {
    return userBanks.find(b => b.bankId === bankId);
  };

  const handleToggleBank = (bankId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isBankSelected(bankId)) {
      // If already selected, just toggle expansion
      setExpandedBank(expandedBank === bankId ? null : bankId);
    } else {
      // If not selected, select it and expand it
      toggleUserBank(bankId);
      setExpandedBank(bankId);
    }
  };

  const handleCheckboxPress = (bankId: string) => {
     toggleUserBank(bankId);
  };

  const handleUpdateCard = (bankId: string, brand: CardBrand, level: CardLevel) => {
    const userBank = getUserBank(bankId);
    if (userBank) {
      updateUserBank(bankId, [{ brand, level }]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
      marginTop: 24,
    },
    bankCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      marginBottom: 12,
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
      padding: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    bankInfo: {
      flex: 1,
    },
    bankName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    bankStatus: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    chevron: {
      marginLeft: 12,
    },
    configSection: {
      padding: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
    },
    configLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: currentTheme.textSecondary,
      marginTop: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    chipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    chipText: {
      fontSize: 12,
      color: currentTheme.text,
    },
    chipTextSelected: {
      color: '#FFF',
      fontWeight: 'bold',
    },
    benefitsList: {
      marginTop: 16,
    },
    benefitItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    benefitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    benefitDesc: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      flex: 1,
    },
    benefitDiscount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    benefitMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    benefitDay: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      backgroundColor: currentTheme.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    benefitBrand: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Beneficios</Text>
        <Text style={styles.subtitle}>
          Configura tus tarjetas para ver descuentos exclusivos.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Bancos Disponibles</Text>
      
      {BANKS.map((bank) => {
        const selected = isBankSelected(bank.id);
        const userBank = getUserBank(bank.id);
        const currentCard = userBank?.cards[0] || { brand: 'visa', level: 'classic' };
        // Expand if explicitly expanded OR if it's the only one selected (optional UX)
        const isExpanded = expandedBank === bank.id;

        return (
          <View key={bank.id} style={[styles.bankCard, selected && styles.bankCardSelected]}>
            <TouchableOpacity style={styles.bankHeader} onPress={() => handleToggleBank(bank.id)}>
              <View style={[styles.iconContainer, { backgroundColor: bank.color }]}>
                <Ionicons name={bank.logo as any} size={24} color="#FFF" />
              </View>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankStatus}>
                  {selected ? `${currentCard.brand.toUpperCase()} ${currentCard.level.toUpperCase()}` : 'Tocar para conectar'}
                </Text>
              </View>
              
              {/* Checkbox for selection state */}
              <TouchableOpacity onPress={() => handleCheckboxPress(bank.id)} style={{ padding: 8 }}>
                 <Ionicons 
                   name={selected ? "checkbox" : "square-outline"} 
                   size={24} 
                   color={selected ? currentTheme.primary : currentTheme.textSecondary} 
                 />
              </TouchableOpacity>

              {/* Chevron for expansion state */}
              {selected && (
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={currentTheme.textSecondary} 
                  style={styles.chevron} 
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
                      style={[styles.chip, currentCard.brand === brand && styles.chipSelected]}
                      onPress={() => handleUpdateCard(bank.id, brand, currentCard.level)}
                    >
                      <Text style={[styles.chipText, currentCard.brand === brand && styles.chipTextSelected]}>
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
                      style={[styles.chip, currentCard.level === level && styles.chipSelected]}
                      onPress={() => handleUpdateCard(bank.id, currentCard.brand, level)}
                    >
                      <Text style={[styles.chipText, currentCard.level === level && styles.chipTextSelected]}>
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
                        <Text style={styles.benefitDesc}>{b.description}</Text>
                        <Text style={styles.benefitDiscount}>{b.discountPercentage}%</Text>
                      </View>
                      <View style={styles.benefitMeta}>
                        <Text style={styles.benefitDay}>{formatBenefitDays(b.days)}</Text>
                        {/* Mock Brand Badge - logic could be more complex */}
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
