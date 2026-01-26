import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
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

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PaymentGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('card');
  const [groupColor, setGroupColor] = useState('#1976D2');
  const [groupDescription, setGroupDescription] = useState('');

  // Estado para el mes/año actual
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
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    groupCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    groupIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    groupInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    groupDescription: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    groupActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
      marginTop: 8,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    statLabel: {
      fontSize: 11,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    payButton: {
      backgroundColor: currentTheme.success,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    payButtonDisabled: {
      backgroundColor: currentTheme.border,
    },
    payButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 12,
      color: currentTheme.text,
      borderWidth: 1,
      borderColor: currentTheme.border,
      fontSize: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
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
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      padding: 10,
      borderRadius: 8,
    },
    modalButtonCancel: {
      backgroundColor: 'transparent',
    },
    modalButtonSave: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    modalButtonTextSave: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Nuevo Grupo</Text>
          </TouchableOpacity>
        </View>

        {paymentGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={styles.emptyText}>
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
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                  </View>
                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleOpenModal(group)}
                    >
                      <Ionicons name="pencil-outline" size={20} color={currentTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(group)}
                    >
                      <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: currentTheme.warning || '#FF9800' }]}>
                      ${formatCurrencyDisplay(stats.pendingAmount)}
                    </Text>
                    <Text style={styles.statLabel}>Pendiente ({stats.pendingCount})</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: currentTheme.success }]}>
                      ${formatCurrencyDisplay(stats.paidAmount)}
                    </Text>
                    <Text style={styles.statLabel}>Pagado ({stats.paidCount})</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      ${formatCurrencyDisplay(stats.pendingAmount + stats.paidAmount)}
                    </Text>
                    <Text style={styles.statLabel}>Total ({stats.totalExpenses})</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.payButton, !hasPending && styles.payButtonDisabled]}
                  onPress={() => handlePaySummary(group)}
                  disabled={!hasPending}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {hasPending ? 'Pagar Resumen' : 'Todo Pagado'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para crear/editar grupo */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo de Pago'}
                </Text>

                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Ej: TC Macro, Visa, Cuotas Auto"
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={styles.inputLabel}>Descripcion (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="Ej: Tarjeta terminada en 1234"
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={styles.inputLabel}>Icono</Text>
                <View style={styles.grid}>
                  {ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.selectionItem,
                        groupIcon === icon && styles.selectedItem,
                        { backgroundColor: currentTheme.surface },
                      ]}
                      onPress={() => setGroupIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.selectionItem,
                        groupColor === color && styles.selectedItem,
                        { backgroundColor: color },
                      ]}
                      onPress={() => setGroupColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={handleSave}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                      Guardar
                    </Text>
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
