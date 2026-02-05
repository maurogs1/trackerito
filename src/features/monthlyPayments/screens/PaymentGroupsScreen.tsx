import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { useToast } from '../../../shared/hooks/useToast';
import { PaymentGroup } from '../../expenses/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PaymentGroupsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentGroups'>;

const ICONS = ['card', 'cash', 'wallet', 'business', 'logo-usd', 'pricetag', 'cart', 'receipt'];
const COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#F44336', '#00BCD4', '#795548'];

export default function PaymentGroupsScreen() {
  const navigation = useNavigation<PaymentGroupsScreenNavigationProp>();
  const {
    paymentGroups,
    loadPaymentGroups,
    addPaymentGroup,
    updatePaymentGroup,
    deletePaymentGroup,
    getGroupExpenses,
    payGroupSummary,
    expenses,
    preferences,
  } = useStore();
  const { showSuccess, showError } = useToast();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PaymentGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('card');
  const [groupColor, setGroupColor] = useState('#1976D2');
  const [groupDescription, setGroupDescription] = useState('');

  const [currentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPaymentGroups();
  }, []);

  const resetForm = () => {
    setGroupName('');
    setGroupIcon('card');
    setGroupColor('#1976D2');
    setGroupDescription('');
    setEditingGroup(null);
  };

  const handleOpenModal = (group?: PaymentGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
      setGroupIcon(group.icon);
      setGroupColor(group.color);
      setGroupDescription(group.description || '');
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el grupo');
      return;
    }

    if (editingGroup) {
      await updatePaymentGroup(editingGroup.id, {
        name: groupName,
        icon: groupIcon,
        color: groupColor,
        description: groupDescription || undefined,
      });
      showSuccess(`"${groupName}" actualizado`);
    } else {
      await addPaymentGroup({
        name: groupName,
        icon: groupIcon,
        color: groupColor,
        description: groupDescription || undefined,
      });
      showSuccess(`"${groupName}" creado`);
    }

    setShowModal(false);
    resetForm();
    loadPaymentGroups();
  };

  const handleDelete = (group: PaymentGroup) => {
    Alert.alert(
      'Eliminar Grupo',
      `¿Eliminar "${group.name}"? Los gastos asociados no se eliminarán, solo se desvinculan del grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePaymentGroup(group.id);
            showSuccess(`"${group.name}" eliminado`);
            loadPaymentGroups();
          },
        },
      ]
    );
  };

  const handlePaySummary = (group: PaymentGroup) => {
    const groupExpenses = getGroupExpenses(group.id, currentMonth, currentYear);
    const pendingExpenses = groupExpenses.filter((e: any) => e.paymentStatus === 'pending');
    const totalPending = pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    if (pendingExpenses.length === 0) {
      Alert.alert('Sin Pendientes', 'No hay gastos pendientes en este grupo para este mes.');
      return;
    }

    Alert.alert(
      'Pagar Resumen',
      `Se marcarán ${pendingExpenses.length} gastos como pagados.\n\nTotal: $${formatCurrencyDisplay(totalPending)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar Todo',
          onPress: async () => {
            await payGroupSummary(group.id, currentMonth, currentYear);
            showSuccess(`Resumen de "${group.name}" pagado`);
          },
        },
      ]
    );
  };

  const getGroupStats = (groupId: string) => {
    const groupExpenses = getGroupExpenses(groupId, currentMonth, currentYear);
    const pending = groupExpenses.filter((e: any) => e.paymentStatus === 'pending');
    const paid = groupExpenses.filter((e: any) => e.paymentStatus === 'paid');

    return {
      totalExpenses: groupExpenses.length,
      pendingCount: pending.length,
      paidCount: paid.length,
      pendingAmount: pending.reduce((sum: number, e: any) => sum + e.amount, 0),
      paidAmount: paid.reduce((sum: number, e: any) => sum + e.amount, 0),
    };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    groupCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    groupIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    groupInfo: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
      marginTop: spacing.sm,
    },
    statItem: {
      alignItems: 'center',
    },
    payButton: {
      backgroundColor: currentTheme.success,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    payButtonDisabled: {
      backgroundColor: currentTheme.border,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    selectionItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedItem: {
      borderColor: currentTheme.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>
            {format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity style={common.buttonPrimary} onPress={() => handleOpenModal()}>
            <View style={common.row}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={[common.buttonPrimaryText, { marginLeft: spacing.xs }]}>Nuevo Grupo</Text>
            </View>
          </TouchableOpacity>
        </View>

        {paymentGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.lg, textAlign: 'center' }]}>
              No tienes grupos de pago.{'\n'}
              Crea uno para agrupar tus cuotas de tarjetas.
            </Text>
          </View>
        ) : (
          paymentGroups.map((group) => {
            const stats = getGroupStats(group.id);
            const hasPending = stats.pendingCount > 0;

            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                    <Ionicons name={group.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>{group.name}</Text>
                    {group.description && (
                      <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>{group.description}</Text>
                    )}
                  </View>
                  <View style={common.row}>
                    <TouchableOpacity style={{ padding: spacing.sm }} onPress={() => handleOpenModal(group)}>
                      <Ionicons name="pencil-outline" size={20} color={currentTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: spacing.sm }} onPress={() => handleDelete(group)}>
                      <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[typography.bodyBold, { color: currentTheme.warning }]}>
                      ${formatCurrencyDisplay(stats.pendingAmount)}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Pendiente ({stats.pendingCount})</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[typography.bodyBold, { color: currentTheme.success }]}>
                      ${formatCurrencyDisplay(stats.paidAmount)}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Pagado ({stats.paidCount})</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                      ${formatCurrencyDisplay(stats.pendingAmount + stats.paidAmount)}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Total ({stats.totalExpenses})</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.payButton, !hasPending && styles.payButtonDisabled]}
                  onPress={() => handlePaySummary(group)}
                  disabled={!hasPending}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                    {hasPending ? 'Pagar Resumen' : 'Todo Pagado'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={common.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={common.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.xl }]}>
                  {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo de Pago'}
                </Text>

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm }]}>Nombre *</Text>
                <TextInput
                  style={common.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Ej: TC Macro, Visa, Cuotas Auto"
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>
                  Descripcion (opcional)
                </Text>
                <TextInput
                  style={common.input}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="Ej: Tarjeta terminada en 1234"
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginTop: spacing.lg }]}>Icono</Text>
                <View style={styles.grid}>
                  {ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.selectionItem, groupIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                      onPress={() => setGroupIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.label, { color: currentTheme.text, marginTop: spacing.lg }]}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.selectionItem, groupColor === color && styles.selectedItem, { backgroundColor: color }]}
                      onPress={() => setGroupColor(color)}
                    />
                  ))}
                </View>

                <View style={[common.rowBetween, { marginTop: spacing.xxl }]}>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={() => { setShowModal(false); resetForm(); }}>
                    <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={common.buttonPrimary} onPress={handleSave}>
                    <Text style={common.buttonPrimaryText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
