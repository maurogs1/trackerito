import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Switch, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_USAGE_LIMITS } from '../../settings/types';
import PhoneInput from '../../../shared/components/PhoneInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../../shared/hooks/useToast';

const COOLDOWN_SECONDS = 60;
const PHONE_EDIT_TS_KEY = 'phone_last_edit_ts';

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
  const { showSuccess, showError } = useToast();

  const [phoneInput, setPhoneInput] = useState(userProfile?.phone_number || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadWhatsappUsage();
    loadUserProfile();
    // Restaurar cooldown guardado
    AsyncStorage.getItem(PHONE_EDIT_TS_KEY).then((ts) => {
      if (ts) {
        const elapsed = Math.floor((Date.now() - parseInt(ts)) / 1000);
        const remaining = COOLDOWN_SECONDS - elapsed;
        if (remaining > 0) startCooldownTimer(remaining);
      }
    });
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  useEffect(() => {
    setPhoneInput(userProfile?.phone_number || '');
  }, [userProfile?.phone_number]);

  const startCooldownTimer = (seconds: number) => {
    setCooldownRemaining(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCooldown = () => {
    AsyncStorage.setItem(PHONE_EDIT_TS_KEY, Date.now().toString());
    startCooldownTimer(COOLDOWN_SECONDS);
  };

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
    try {
      await sendWelcomeMessage(phoneInput);
      await updatePhoneNumber(phoneInput);
      setIsEditingPhone(false);
      setPhoneError('');
      startCooldown();
      showSuccess('WhatsApp vinculado. Te enviamos un mensaje de bienvenida.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isDebugUser = userProfile?.user_id === '9fa4531b-2c1f-4002-957a-8113f60a4640';
      if (isDebugUser) {
        const BOT_URL = process.env.EXPO_PUBLIC_BOT_URL ?? 'undefined';
        showError(`[DEBUG] ${BOT_URL} | ${msg}`);
      } else if (msg === 'network') {
        showError('El bot no responde. Probá de nuevo en unos minutos.');
      } else if (msg.startsWith('server:')) {
        showError('Hubo un problema al enviar el mensaje. Probá de nuevo más tarde.');
      } else {
        showError('No se pudo vincular el WhatsApp. Intentá de nuevo.');
      }
    }
  };

  const sendWelcomeMessage = async (phoneNumber: string) => {
    const BOT_URL = process.env.EXPO_PUBLIC_BOT_URL;
    const BOT_API_KEY = process.env.EXPO_PUBLIC_BOT_API_KEY;
    if (!BOT_URL) throw new Error('config');
    let response: Response;
    try {
      response = await fetch(`${BOT_URL}/api/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(BOT_API_KEY ? { 'Authorization': `Bearer ${BOT_API_KEY}` } : {}),
        },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      throw new Error('network');
    }
    if (!response.ok) throw new Error(`server:${response.status}`);
  };

  const handleDeletePhone = async () => {
    try {
      await updatePhoneNumber('');
      setShowDeleteModal(false);
      setPhoneInput('');
      setIsEditingPhone(false);
      startCooldown();
    } catch (error) {
      showError('No se pudo eliminar el número');
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
      showError('No se pudo cambiar la configuración');
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
    howToRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
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

      {/* How to use */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cómo usar el bot</Text>
        {[
          { icon: 'cash-outline' as const,      label: 'Gasto',       example: '"500 super" · "1200 farmacia ayer"' },
          { icon: 'trending-up-outline' as const, label: 'Ingreso',    example: '"cobré 50000 sueldo" · "me pagaron 20000"' },
          { icon: 'repeat-outline' as const,    label: 'Gasto fijo',  example: '"!fijo alquiler 425000" · "vence todos los 5"' },
          { icon: 'pricetag-outline' as const,  label: 'Categoría',   example: '"500 super #supermercado"' },
          { icon: 'mic-outline' as const,       label: 'Audio',       example: 'Mandá un mensaje de voz' },
        ].map((item, i, arr) => (
          <View key={item.label}>
            <View style={styles.howToRow}>
              <Ionicons name={item.icon} size={18} color={currentTheme.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.captionBold, { color: currentTheme.text }]}>{item.label}</Text>
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>{item.example}</Text>
              </View>
            </View>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
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
              {cooldownRemaining > 0 ? (
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                  {cooldownRemaining}s
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => setIsEditingPhone(true)}
                activeOpacity={0.7}
                disabled={cooldownRemaining > 0}
              >
                <Ionicons name="pencil" size={18} color={cooldownRemaining > 0 ? currentTheme.textSecondary : currentTheme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.7}
                disabled={cooldownRemaining > 0}
              >
                <Ionicons name="trash" size={18} color={cooldownRemaining > 0 ? currentTheme.textSecondary : currentTheme.error} />
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
