import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { PREDEFINED_SERVICES, searchServices } from '../mockServices';

type RecurringServicesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecurringServices'>;

export default function RecurringServicesScreen() {
  const navigation = useNavigation<RecurringServicesScreenNavigationProp>();
  const {
    recurringServices,
    loadRecurringServices,
    preferences,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecurringServices();
  }, []);

  const filteredServices = searchQuery ? searchServices(searchQuery) : PREDEFINED_SERVICES;

  const handleSelectPredefinedService = (service: typeof PREDEFINED_SERVICES[0]) => {
    if (service.name === 'Agregar Personalizado' || service.name === 'Otros') {
      // Navigate to blank form
      navigation.navigate('AddRecurringService');
    } else {
      // Navigate with prefilled data
      navigation.navigate('AddRecurringService', {
        prefilledName: service.name,
        prefilledIcon: service.icon,
        prefilledColor: service.color,
        prefilledAmount: service.commonAmount,
        prefilledDay: service.commonDay,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.xl,
    },
    searchContainer: {
      marginBottom: spacing.xl,
    },
    searchInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      paddingLeft: 44,
      color: currentTheme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchIcon: {
      position: 'absolute',
      left: spacing.lg,
      top: spacing.md,
      zIndex: 1,
    },
    predefinedServiceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    predefinedIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    predefinedInfo: {
      flex: 1,
    },
    emptyState: {
      padding: spacing.xxxl,
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={currentTheme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar (ej: Alquiler, Netflix, Luz, Gym...)"
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gastos Fijos Predefinidos */}
        <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md }]}>
          {searchQuery ? `Resultados (${filteredServices.length})` : 'Agregar Gasto Fijo'}
        </Text>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={currentTheme.textSecondary} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              No se encontraron gastos con "{searchQuery}"
            </Text>
          </View>
        ) : (
          filteredServices.map((service, index) => {
            const isAlreadyAdded = recurringServices.some(s => s.name === service.name);

            return (
              <TouchableOpacity
                key={`${service.name}-${index}`}
                style={[styles.predefinedServiceCard, isAlreadyAdded && { opacity: 0.5 }]}
                onPress={() => !isAlreadyAdded && handleSelectPredefinedService(service)}
                disabled={isAlreadyAdded}
              >
                <View style={[styles.predefinedIconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={20} color={service.color} />
                </View>
                <View style={styles.predefinedInfo}>
                  <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                    {service.name}{isAlreadyAdded && ' ✓ Agregado'}
                  </Text>
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                    {service.category}{service.commonAmount && ` • ~${formatCurrencyDisplay(service.commonAmount)}/mes`}
                  </Text>
                </View>
                {!isAlreadyAdded && (
                  <Ionicons name="add-circle-outline" size={24} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
