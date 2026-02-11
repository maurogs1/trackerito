import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Switch, TouchableOpacity, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_USAGE_LIMITS } from '../../settings/types';
import PhoneInput from '../../../shared/components/PhoneInput';

export default function WhatsAppScreen() {
  const {
    userProfile,
    userProfileLoading,
    whatsappUsage,
    whatsappUsageLoading,
    loadWhatsappUsage,
    loadUserProfile,
    updatePhoneNumber,
    toggleWhatsappNotifications,
    preferences,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);

  const [phoneInput, setPhoneInput] = useState(userProfile?.phone_number || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadWhatsappUsage();
    loadUserProfile();
  }, []);

  useEffect(() => {
    setPhoneInput(userProfile?.phone_number || '');
  }, [userProfile?.phone_number]);

  const hasPhone = !!userProfile?.phone_number;

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      setPhoneError('Completá los campos de teléfono');
      return;
    }
    if (!validatePhone(phoneInput)) {
      setPhoneError('Número incompleto');
      return;
    }
    const isFirstSetup = !hasPhone;
    try {
      await updatePhoneNumber(phoneInput);
      setIsEditingPhone(false);
      setPhoneError('');

      if (isFirstSetup) {
        // Enviar mensaje de bienvenida por WhatsApp
        sendWelcomeMessage(phoneInput);
        Alert.alert('¡Listo!', 'Tu WhatsApp fue vinculado. Te enviamos un mensaje de bienvenida al bot.');
      } else {
        Alert.alert('Guardado', 'Tu número de WhatsApp ha sido actualizado');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el número');
    }
  };

  const sendWelcomeMessage = async (phoneNumber: string) => {
    try {
      const BOT_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-bot-url.com';
      await fetch(`${BOT_URL}/api/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      // Silencioso - no bloquear si el bot no está disponible
      console.log('Bot no disponible para enviar bienvenida');
    }
  };

  const handleDeletePhone = async () => {
    try {
      await updatePhoneNumber('');
      setShowDeleteModal(false);
      setPhoneInput('');
      setIsEditingPhone(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el número');
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
      Alert.alert('Error', 'No se pudo cambiar la configuración');
    }
  };

  // --- Computed ---
  const pointsUsed = whatsappUsage?.points_used ?? 0;
  const remaining = WHATSAPP_USAGE_LIMITS.DAILY_POINTS - pointsUsed;
  const percentage = (remaining / WHATSAPP_USAGE_LIMITS.DAILY_POINTS) * 100;
  const isExhausted = pointsUsed >= WHATSAPP_USAGE_LIMITS.DAILY_POINTS;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    card: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    cardTitle: {
      ...typography.bodyBold,
      color: currentTheme.text,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    label: {
      ...typography.body,
      color: currentTheme.textSecondary,
    },
    value: {
      ...typography.bodyBold,
      color: currentTheme.text,
    },
    bigNumber: {
      ...typography.amountMedium,
      color: isExhausted ? currentTheme.error : currentTheme.primary,
    },
    progressBarBg: {
      height: 10,
      backgroundColor: currentTheme.border,
      borderRadius: 5,
      marginTop: spacing.md,
      marginBottom: spacing.md,
      overflow: 'hidden' as const,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: isExhausted ? currentTheme.error : currentTheme.primary,
    },
    divider: {
      height: 1,
      backgroundColor: currentTheme.border,
      marginVertical: spacing.md,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    costItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    costBadge: {
      backgroundColor: currentTheme.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    costBadgeText: {
      ...typography.captionBold,
      color: currentTheme.primary,
    },
    errorText: {
      ...typography.caption,
      color: currentTheme.error,
      marginTop: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    saveButton: {
      flex: 1,
      backgroundColor: currentTheme.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: currentTheme.textSecondary,
      alignItems: 'center',
    },
    phoneDisplayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    phoneActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    deleteModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
      marginTop: spacing.xl,
    },
  });

  // === No phone configured: show setup form ===
  if (!hasPhone) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xxl }]}>
          <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
          <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
            Configurá tu WhatsApp
          </Text>
          <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
            Ingresá tu número para usar el bot y registrar gastos por chat o voz.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Número de teléfono</Text>
          <PhoneInput
            value={phoneInput}
            onChangeValue={(val) => { setPhoneInput(val); setPhoneError(''); }}
            currentTheme={currentTheme}
            error={phoneError}
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: spacing.lg }, userProfileLoading && { opacity: 0.6 }]}
            onPress={handleSavePhone}
            disabled={userProfileLoading}
            activeOpacity={0.7}
          >
            {userProfileLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[typography.bodyBold, { color: '#FFF' }]}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // === Loading ===
  if (whatsappUsageLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  // === Main screen (phone configured) ===
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {/* Usage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uso diario</Text>

        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={styles.bigNumber}>{remaining}</Text>
          <Text style={styles.label}>puntos restantes de {WHATSAPP_USAGE_LIMITS.DAILY_POINTS}</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>

        <View style={styles.row}>
          <View style={styles.statusRow}>
            <Ionicons name="chatbubble-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={styles.label}>Textos enviados</Text>
          </View>
          <Text style={styles.value}>{whatsappUsage?.text_count ?? 0}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.statusRow}>
            <Ionicons name="mic-outline" size={16} color={currentTheme.textSecondary} />
            <Text style={styles.label}>Audios enviados</Text>
          </View>
          <Text style={styles.value}>{whatsappUsage?.audio_count ?? 0}</Text>
        </View>
      </View>

      {/* Costs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Costos</Text>

        <View style={styles.costItem}>
          <Ionicons name="chatbubble" size={20} color={currentTheme.primary} />
          <Text style={[styles.label, { flex: 1 }]}>Mensaje de texto</Text>
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>{WHATSAPP_USAGE_LIMITS.TEXT_COST} pto</Text>
          </View>
        </View>

        <View style={styles.costItem}>
          <Ionicons name="mic" size={20} color={currentTheme.primary} />
          <Text style={[styles.label, { flex: 1 }]}>Mensaje de voz</Text>
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>{WHATSAPP_USAGE_LIMITS.AUDIO_COST} pts</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
          Los puntos se renuevan todos los dias a las 00:00
        </Text>
      </View>

      {/* Config */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuración</Text>

        {/* Phone display / edit */}
        {isEditingPhone ? (
          <View>
            <PhoneInput
              value={phoneInput}
              onChangeValue={(val) => { setPhoneInput(val); setPhoneError(''); }}
              currentTheme={currentTheme}
              error={phoneError}
            />
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit} activeOpacity={0.7}>
                <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, userProfileLoading && { opacity: 0.6 }]}
                onPress={handleSavePhone}
                disabled={userProfileLoading}
                activeOpacity={0.7}
              >
                {userProfileLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.bodyBold, { color: '#FFF' }]}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.phoneDisplayRow}>
            <View>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={[styles.value, { marginTop: spacing.xs }]}>{userProfile.phone_number}</Text>
            </View>
            <View style={styles.phoneActions}>
              <TouchableOpacity onPress={() => setIsEditingPhone(true)} activeOpacity={0.7}>
                <Ionicons name="pencil" size={18} color={currentTheme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteModal(true)} activeOpacity={0.7}>
                <Ionicons name="trash" size={18} color={currentTheme.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Notifications toggle */}
        <View style={styles.row}>
          <Text style={[typography.body, { color: currentTheme.text }]}>Notificaciones</Text>
          <Switch
            value={userProfile?.whatsapp_notifications_enabled ?? true}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: currentTheme.primary }}
            thumbColor={userProfile?.whatsapp_notifications_enabled ? '#FFFFFF' : '#f4f3f4'}
            disabled={userProfileLoading}
          />
        </View>
      </View>

      {/* Delete phone modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.deleteModalContent}>
                <Ionicons name="warning" size={48} color={currentTheme.error} />
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
                  Eliminar número
                </Text>
                <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                  Se desvinculará tu número de WhatsApp. No podrás usar el bot hasta configurar uno nuevo.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: currentTheme.error }]}
                    onPress={handleDeletePhone}
                    activeOpacity={0.7}
                  >
                    <Text style={[typography.bodyBold, { color: '#FFF' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}
