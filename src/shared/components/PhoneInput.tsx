import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { typography, spacing, borderRadius, createCommonStyles } from '../theme';
import { Theme } from '../theme';

interface Country {
  name: string;
  flag: string;
  code: string;
  dialCode: string;
}

const SOUTH_AMERICAN_COUNTRIES: Country[] = [
  { name: 'Argentina', flag: '🇦🇷', code: 'AR', dialCode: '+54' },
  { name: 'Bolivia', flag: '🇧🇴', code: 'BO', dialCode: '+591' },
  { name: 'Brasil', flag: '🇧🇷', code: 'BR', dialCode: '+55' },
  { name: 'Chile', flag: '🇨🇱', code: 'CL', dialCode: '+56' },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO', dialCode: '+57' },
  { name: 'Ecuador', flag: '🇪🇨', code: 'EC', dialCode: '+593' },
  { name: 'Paraguay', flag: '🇵🇾', code: 'PY', dialCode: '+595' },
  { name: 'Perú', flag: '🇵🇪', code: 'PE', dialCode: '+51' },
  { name: 'Uruguay', flag: '🇺🇾', code: 'UY', dialCode: '+598' },
  { name: 'Venezuela', flag: '🇻🇪', code: 'VE', dialCode: '+58' },
];

interface PhoneInputProps {
  value: string;
  onChangeValue: (fullNumber: string) => void;
  currentTheme: Theme;
  error?: string;
}

/**
 * Parses a full phone number string into country, area, and number parts.
 * E.g. "+5491112345678" → { country: AR, area: "11", number: "12345678" }
 */
function parsePhoneNumber(fullNumber: string) {
  if (!fullNumber) {
    return { country: SOUTH_AMERICAN_COUNTRIES[0], area: '', number: '' };
  }

  // Try to match country by dial code (longest match first)
  const sorted = [...SOUTH_AMERICAN_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (fullNumber.startsWith(country.dialCode)) {
      const rest = fullNumber.slice(country.dialCode.length);
      // For Argentina: skip the 9 (mobile prefix), then area is first 2-4 digits
      if (country.code === 'AR' && rest.startsWith('9')) {
        const withoutNine = rest.slice(1);
        // Area code: first 2 digits for Buenos Aires (11), up to 4 for other areas
        const area = withoutNine.slice(0, 2);
        const number = withoutNine.slice(2);
        return { country, area, number };
      }
      // Generic: first 2 digits as area
      const area = rest.slice(0, 2);
      const number = rest.slice(2);
      return { country, area, number };
    }
  }

  return { country: SOUTH_AMERICAN_COUNTRIES[0], area: '', number: fullNumber.replace(/\D/g, '') };
}

export default function PhoneInput({ value, onChangeValue, currentTheme, error }: PhoneInputProps) {
  const parsed = parsePhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
  const [area, setArea] = useState(parsed.area);
  const [number, setNumber] = useState(parsed.number);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const common = createCommonStyles(currentTheme);

  const buildFullNumber = (country: Country, areaCode: string, phoneNumber: string) => {
    if (!areaCode && !phoneNumber) return '';
    const digits = areaCode + phoneNumber;
    // Argentina uses 9 prefix for mobile
    if (country.code === 'AR') {
      return `${country.dialCode}9${digits}`;
    }
    return `${country.dialCode}${digits}`;
  };

  const handleAreaChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setArea(cleaned);
    onChangeValue(buildFullNumber(selectedCountry, cleaned, number));
  };

  const handleNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setNumber(cleaned);
    onChangeValue(buildFullNumber(selectedCountry, area, cleaned));
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    onChangeValue(buildFullNumber(country, area, number));
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.background,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    input: {
      ...typography.body,
      color: currentTheme.text,
      backgroundColor: currentTheme.background,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: error ? currentTheme.error : currentTheme.border,
      textAlign: 'center',
    },
    areaInput: {
      width: 65,
    },
    numberInput: {
      flex: 1,
    },
    label: {
      ...typography.caption,
      color: currentTheme.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    // Country picker modal
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '85%',
      maxWidth: 400,
      maxHeight: '70%',
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      gap: spacing.md,
    },
    countryItemLast: {
      borderBottomWidth: 0,
    },
  });

  return (
    <View style={styles.container}>
      {/* Labels row */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>País</Text>
          <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryPicker(true)} activeOpacity={0.7}>
            <Text style={[typography.body, { color: currentTheme.text }]}>{selectedCountry.dialCode}</Text>
            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.label}>Área</Text>
          <TextInput
            style={[styles.input, styles.areaInput]}
            value={area}
            onChangeText={handleAreaChange}
            placeholder="11"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Número</Text>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={number}
            onChangeText={handleNumberChange}
            placeholder="12345678"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg, textAlign: 'center' }]}>
                  Seleccionar país
                </Text>
                <FlatList
                  data={SOUTH_AMERICAN_COUNTRIES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        index === SOUTH_AMERICAN_COUNTRIES.length - 1 && styles.countryItemLast,
                        item.code === selectedCountry.code && { backgroundColor: currentTheme.primary + '10' },
                      ]}
                      onPress={() => handleCountrySelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[typography.body, { color: currentTheme.text, flex: 1 }]}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
