import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {
    preferences,
    toggleTheme,
    user,
    userProfile,
    userProfileLoading,
    loadUserProfile,
    updatePhoneNumber,
    toggleWhatsappNotifications,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [phoneInput, setPhoneInput] = useState(userProfile?.phone_number || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    setPhoneInput(userProfile?.phone_number || '');
  }, [userProfile?.phone_number]);

  // Verificar si puede editar (una vez por semana)
  const canEditPhone = (): boolean => {
    if (!userProfile?.phone_number) return true; // Si no tiene teléfono, puede agregar
    if (!userProfile?.updated_at) return true;

    const lastUpdate = new Date(userProfile.updated_at);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceUpdate >= 7;
  };

  const getDaysUntilEdit = (): number => {
    if (!userProfile?.updated_at) return 0;
    const lastUpdate = new Date(userProfile.updated_at);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysSinceUpdate);
  };

  const handleEditPress = () => {
    if (!canEditPhone()) {
      const daysLeft = getDaysUntilEdit();
      Alert.alert(
        'Edición no disponible',
        `Podrás editar tu número en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}.`
      );
      return;
    }
    setIsEditingPhone(true);
  };

  // Formatear teléfono mientras escribe
  const formatPhoneNumber = (text: string) => {
    // Remover todo excepto números y +
    let cleaned = text.replace(/[^\d+]/g, '');

    // Si no empieza con +, agregar +54 por defecto para Argentina
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      // Si empieza con 54, agregar solo el +
      if (cleaned.startsWith('54')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('9')) {
        // Si empieza con 9, es formato argentino sin código país
        cleaned = '+54' + cleaned;
      }
    }

    return cleaned;
  };

  // Validar formato de teléfono (mínimo 10 dígitos)
  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneInput(formatted);
    setPhoneError('');
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      // Permitir guardar vacío (eliminar teléfono)
      try {
        await updatePhoneNumber('');
        setIsEditingPhone(false);
        setPhoneError('');
      } catch (error) {
        Alert.alert('Error', 'No se pudo guardar');
      }
      return;
    }

    if (!validatePhone(phoneInput)) {
      setPhoneError('Ingresa un número válido (mín. 10 dígitos)');
      return;
    }

    try {
      await updatePhoneNumber(phoneInput);
      setIsEditingPhone(false);
      setPhoneError('');
      Alert.alert('Guardado', 'Tu número de teléfono ha sido actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el número de teléfono');
    }
  };

  const handleCancelEdit = () => {
    setPhoneInput(userProfile?.phone_number || '');
    setIsEditingPhone(false);
    setPhoneError('');
  };

  const handleToggleNotifications = async () => {
    try {
      await toggleWhatsappNotifications();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la configuración de notificaciones');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    section: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.captionBold,
      color: currentTheme.textSecondary,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    label: {
      ...typography.body,
      color: currentTheme.text,
    },
    value: {
      ...typography.body,
      color: currentTheme.textSecondary,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: currentTheme.text,
      backgroundColor: currentTheme.background,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    saveButtonText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
    },
    editButton: {
      color: currentTheme.primary,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    phoneEditContainer: {
      flex: 1,
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: currentTheme.textSecondary,
    },
    cancelButtonText: {
      ...typography.body,
      color: currentTheme.textSecondary,
    },
    errorText: {
      ...typography.caption,
      color: currentTheme.error,
      marginTop: spacing.xs,
    },
    phoneHint: {
      ...typography.caption,
      color: currentTheme.textSecondary,
      marginTop: spacing.xs,
    },
    phoneDisplayContainer: {
      paddingVertical: spacing.sm,
    },
    phoneDisplayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    phoneValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    editIconButton: {
      padding: spacing.xs,
    },
    editCooldownText: {
      ...typography.caption,
      color: currentTheme.textSecondary,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    divider: {
      height: 1,
      backgroundColor: currentTheme.border,
      marginVertical: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Modo Oscuro</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: currentTheme.primary }}
            thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Moneda</Text>
          <Text style={styles.value}>{preferences.currency}</Text>
        </View>
        <TouchableOpacity
          style={[styles.row, { marginTop: spacing.sm }]}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.label}>Gestionar Categorías</Text>
          <Text style={{ color: currentTheme.primary }}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones WhatsApp</Text>
        {isEditingPhone ? (
          <View style={styles.phoneEditContainer}>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={[styles.input, phoneError ? { borderWidth: 1, borderColor: currentTheme.error } : {}]}
                value={phoneInput}
                onChangeText={handlePhoneChange}
                placeholder="+54 9 11 12345678"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : (
              <Text style={styles.phoneHint}>Ej: +54 9 11 12345678 (con código de país)</Text>
            )}
            <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, userProfileLoading && { opacity: 0.6 }]}
                onPress={handleSavePhone}
                disabled={userProfileLoading}
              >
                {userProfileLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
          </View>
        ) : (
          <View style={styles.phoneDisplayContainer}>
            <View style={styles.phoneDisplayRow}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.phoneValueContainer}>
                <Text style={[styles.value, !userProfile?.phone_number && { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
                  {userProfile?.phone_number || 'No configurado'}
                </Text>
                <TouchableOpacity
                  onPress={handleEditPress}
                  style={[styles.editIconButton, !canEditPhone() && { opacity: 0.4 }]}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={currentTheme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {!canEditPhone() && (
              <Text style={styles.editCooldownText}>
                Podrás editar en {getDaysUntilEdit()} día{getDaysUntilEdit() !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Recibir recordatorios</Text>
          <Switch
            value={userProfile?.whatsapp_notifications_enabled ?? true}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: currentTheme.primary }}
            thumbColor={userProfile?.whatsapp_notifications_enabled ? '#FFFFFF' : '#f4f3f4'}
            disabled={userProfileLoading}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        {user?.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.row, { paddingVertical: spacing.md }]}
          onPress={async () => {
            try {
              const { signOut } = useStore.getState();
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Hubo un problema al cerrar sesión');
            }
          }}
        >
          <Text style={[styles.label, { color: currentTheme.error }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
