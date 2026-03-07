import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';
import { IncomeTypeItem } from '../../../store/slices/incomeTypesSlice';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'IncomeTypes'>;

export default function IncomeTypesScreen() {
  const navigation = useNavigation<NavProp>();
  const { incomeTypes, removeIncomeType, loadIncomeTypes, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess } = useToast();

  const [typeToDelete, setTypeToDelete] = useState<IncomeTypeItem | null>(null);

  useEffect(() => {
    loadIncomeTypes();
  }, []);

  const confirmDelete = async () => {
    if (!typeToDelete) return;
    await removeIncomeType(typeToDelete.id);
    showSuccess(`"${typeToDelete.name}" eliminado`);
    setTypeToDelete(null);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    addButton: {
      backgroundColor: currentTheme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      gap: spacing.md,
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
    deleteModalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: currentTheme.text }]}>Tipos de Ingreso</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('IncomeTypeForm')}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={incomeTypes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => setTypeToDelete(item)}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('IncomeTypeForm', { incomeTypeId: item.id })}
              activeOpacity={0.7}
            >
              <View style={[common.iconContainerSmall, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[typography.bodyBold, { color: currentTheme.text, flex: 1 }]}>{item.name}</Text>
            </TouchableOpacity>
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: spacing.xxl }]}>
            No hay tipos de ingreso
          </Text>
        }
      />

      <Modal visible={!!typeToDelete} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setTypeToDelete(null)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.deleteModalContent}>
                  <View style={{ marginBottom: spacing.lg }}>
                    <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.md }]}>
                    Eliminar Tipo
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
                    {`¿Querés eliminar "${typeToDelete?.name}"? Los ingresos que lo usen quedarán sin tipo asignado.`}
                  </Text>
                  <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                      onPress={() => setTypeToDelete(null)}
                    >
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, { backgroundColor: currentTheme.error }]}
                      onPress={confirmDelete}
                    >
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
