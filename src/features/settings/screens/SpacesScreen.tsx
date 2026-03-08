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
import { Space } from '../../../store/slices/spacesSlice';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Spaces'>;

export default function SpacesScreen() {
  const navigation = useNavigation<NavProp>();
  const { spaces, activeSpaceId, removeSpace, loadSpaces, setActiveSpace, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);

  useEffect(() => {
    loadSpaces();
  }, []);

  const confirmDelete = async () => {
    if (!spaceToDelete) return;
    try {
      await removeSpace(spaceToDelete.id);
      showSuccess(`"${spaceToDelete.name}" eliminado`);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo eliminar el espacio');
    }
    setSpaceToDelete(null);
  };

  const handleSetActive = (space: Space) => {
    setActiveSpace(space.id);
    showSuccess(`Cambiaste a "${space.name}"`);
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
    activeItem: {
      borderColor: currentTheme.primary,
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
        <Text style={[typography.title, { color: currentTheme.text }]}>Espacios</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SpaceForm')}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={spaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={item.isDefault ? undefined : () => setSpaceToDelete(item)}>
            <TouchableOpacity
              style={[styles.item, item.id === activeSpaceId && styles.activeItem]}
              onPress={() => navigation.navigate('SpaceForm', { spaceId: item.id })}
              onLongPress={() => handleSetActive(item)}
              activeOpacity={0.7}
            >
              <View style={[common.iconContainerSmall, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{item.name}</Text>
                {item.isDefault && (
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Predeterminado</Text>
                )}
              </View>
              {item.id === activeSpaceId && (
                <Ionicons name="checkmark-circle" size={20} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: spacing.xxl }]}>
            No hay espacios
          </Text>
        }
        ListFooterComponent={
          <Text style={[typography.caption, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: spacing.lg }]}>
            Mantené presionado un espacio para activarlo
          </Text>
        }
      />

      <Modal visible={!!spaceToDelete} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSpaceToDelete(null)}>
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
                    Eliminar Espacio
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
                    {`¿Querés eliminar "${spaceToDelete?.name}"? Los datos de este espacio quedarán sin espacio asignado.`}
                  </Text>
                  <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                      onPress={() => setSpaceToDelete(null)}
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
