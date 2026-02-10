import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_USAGE_LIMITS } from '../../settings/types';

export default function WhatsAppScreen() {
  const {
    userProfile,
    whatsappUsage,
    whatsappUsageLoading,
    loadWhatsappUsage,
    preferences,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    loadWhatsappUsage();
  }, []);

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
    noPhoneText: {
      ...typography.body,
      color: currentTheme.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xxl,
    },
  });

  if (!userProfile?.phone_number) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xxxl }]}>
          <Ionicons name="logo-whatsapp" size={48} color={currentTheme.textSecondary} />
          <Text style={[styles.noPhoneText, { marginTop: spacing.lg }]}>
            Para usar el bot de WhatsApp, primero configura tu numero de telefono en Configuracion.
          </Text>
        </View>
      </View>
    );
  }

  if (whatsappUsageLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Telefono</Text>
          <Text style={styles.value}>{userProfile.phone_number}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Notificaciones</Text>
          <Text style={[styles.value, { color: userProfile.whatsapp_notifications_enabled ? currentTheme.success : currentTheme.error }]}>
            {userProfile.whatsapp_notifications_enabled ? 'Activas' : 'Desactivadas'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
