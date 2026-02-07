import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { useToast } from '../../../shared/hooks/useToast';
import { CategoryPicker } from '../../../shared/components/CategoryPicker';

type AddRecurringServiceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddRecurringService'>;
type AddRecurringServiceRouteProp = RouteProp<RootStackParamList, 'AddRecurringService'>;

export default function AddRecurringServiceScreen() {
  const navigation = useNavigation<AddRecurringServiceNavigationProp>();
  const route = useRoute<AddRecurringServiceRouteProp>();
  const {
    preferences,
    recurringServices,
    addRecurringService,
    updateRecurringService,
    loadRecurringServices,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const serviceId = route.params?.serviceId;
  const isEditing = !!serviceId;

  const [serviceName, setServiceName] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceDay, setServiceDay] = useState('15');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [serviceIcon, setServiceIcon] = useState('pricetag');
  const [serviceColor, setServiceColor] = useState('#607D8B');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isDayFocused, setIsDayFocused] = useState(false);

  useEffect(() => {
    if (isEditing && serviceId) {
      const service = recurringServices.find(s => s.id === serviceId);
      if (service) {
        setServiceName(service.name);
        setServiceAmount(formatCurrencyInput(service.estimated_amount.toString()));
        setServiceDay(service.day_of_month.toString());
        setSelectedCategoryIds(service.category_id ? [service.category_id] : []);
        setServiceIcon(service.icon);
        setServiceColor(service.color);
        navigation.setOptions({ title: 'Editar Gasto Fijo' });
      }
    } else {
      // Prefilled from predefined service selection
      if (route.params?.prefilledName) setServiceName(route.params.prefilledName);
      if (route.params?.prefilledIcon) setServiceIcon(route.params.prefilledIcon);
      if (route.params?.prefilledColor) setServiceColor(route.params.prefilledColor);
      if (route.params?.prefilledAmount) setServiceAmount(formatCurrencyInput(route.params.prefilledAmount.toString()));
      if (route.params?.prefilledDay) setServiceDay(route.params.prefilledDay.toString());
    }
  }, [serviceId, isEditing, recurringServices]);

  const handleSave = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }

    if (!serviceAmount.trim()) {
      Alert.alert('Error', 'Por favor ingresa un monto estimado');
      return;
    }

    const amount = parseCurrencyInput(serviceAmount);
    const day = parseInt(serviceDay);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Error', 'El día debe estar entre 1 y 31');
      return;
    }

    const categoryId = selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;

    if (isEditing && serviceId) {
      try {
        await updateRecurringService(serviceId, {
          name: serviceName.trim(),
          estimated_amount: amount,
          day_of_month: day,
          category_id: categoryId,
          icon: serviceIcon,
          color: serviceColor,
        });
        showSuccess(`"${serviceName}" actualizado correctamente`);
        loadRecurringServices();
        navigation.goBack();
      } catch (error) {
        showError('Error al actualizar');
      }
    } else {
      const newService = await addRecurringService({
        name: serviceName.trim(),
        estimated_amount: amount,
        day_of_month: day,
        category_id: categoryId,
        icon: serviceIcon,
        color: serviceColor,
        is_active: true,
      });

      if (newService) {
        showSuccess(`"${serviceName}" agregado correctamente`);
        loadRecurringServices();
        navigation.goBack();
      } else {
        showError('Error al agregar');
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    label: {
      ...typography.body,
      color: currentTheme.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    inputContainer: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      height: 50,
      justifyContent: 'center',
    },
    inputFocused: {
      borderColor: currentTheme.primary,
    },
    inputField: {
      color: currentTheme.text,
      paddingHorizontal: spacing.lg,
      fontSize: 16,
      height: '100%',
      ...Platform.select({
        web: {
          outlineStyle: 'none',
        }
      }),
      textAlignVertical: 'center',
    } as any,
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xxxl,
      marginBottom: spacing.xxxl,
    },
    previewCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginTop: spacing.xl,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Nombre del servicio</Text>
        <View style={[styles.inputContainer, isNameFocused && styles.inputFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="Ej: Netflix, Alquiler, Gym..."
            placeholderTextColor={currentTheme.textSecondary}
            value={serviceName}
            onChangeText={setServiceName}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            autoFocus={!isEditing}
          />
        </View>

        <Text style={styles.label}>Monto estimado</Text>
        <View style={[styles.inputContainer, isAmountFocused && styles.inputFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="0,00"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="numeric"
            value={serviceAmount}
            onChangeText={(text) => setServiceAmount(formatCurrencyInput(text))}
            onFocus={() => setIsAmountFocused(true)}
            onBlur={() => setIsAmountFocused(false)}
          />
        </View>

        <Text style={styles.label}>Día del mes (vencimiento)</Text>
        <View style={[styles.inputContainer, isDayFocused && styles.inputFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="15"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
            value={serviceDay}
            onChangeText={(text) => {
              const num = parseInt(text);
              if (text === '' || (!isNaN(num) && num >= 1 && num <= 31)) {
                setServiceDay(text);
              }
            }}
            onFocus={() => setIsDayFocused(true)}
            onBlur={() => setIsDayFocused(false)}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <CategoryPicker
            selectedIds={selectedCategoryIds}
            onSelectionChange={setSelectedCategoryIds}
            multiSelect={false}
            label="Categoría (opcional)"
          />
        </View>

        {/* Preview */}
        {serviceName.trim() !== '' && (
          <View style={styles.previewCard}>
            <View style={[styles.previewIcon, { backgroundColor: serviceColor }]}>
              <Ionicons name={serviceIcon as any} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{serviceName}</Text>
              <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                {serviceAmount ? `$${serviceAmount}` : 'Sin monto'} - Vence el {serviceDay || '?'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
