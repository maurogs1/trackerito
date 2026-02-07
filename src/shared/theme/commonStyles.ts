import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { spacing, borderRadius, shadows } from './spacing';
import { typography } from './typography';
import { Theme } from './index';

// Función para crear estilos comunes con el theme actual
export const createCommonStyles = (theme: Theme) => StyleSheet.create({
  // === CONTAINERS ===

  // Container principal de pantalla
  screenContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Contenido con padding estándar
  screenContent: {
    padding: spacing.xl,
  },

  // Header de pantalla (título + subtítulo)
  screenHeader: {
    marginBottom: spacing.xxl,
  },

  // === CARDS ===

  // Card básica
  card: {
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },

  // Card seleccionable
  cardSelectable: {
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Card seleccionada
  cardSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '08',
  },

  // === ROWS Y LAYOUTS ===

  // Fila con items separados (justify between)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // === INPUTS ===

  // Input de texto básico
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    fontSize: 16,
    color: theme.text,
  },

  inputFocused: {
    borderColor: theme.primary,
  },

  inputError: {
    borderColor: theme.error,
  },

  // === BUTTONS ===

  // Botón primario
  buttonPrimary: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Botón secundario (outline)
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.primary,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonSecondaryText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Botón deshabilitado
  buttonDisabled: {
    backgroundColor: theme.border,
  },

  // === CHIPS / TAGS ===

  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },

  chipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },

  chipText: {
    fontSize: 12,
    color: theme.text,
  },

  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // === MODAL ===

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  // === LISTS ===

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  listItemLast: {
    borderBottomWidth: 0,
  },

  // === EMPTY STATE ===

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },

  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // === ICON CONTAINERS ===

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === DIVIDERS ===

  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: spacing.lg,
  },

  // === BADGES ===

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export type CommonStyles = ReturnType<typeof createCommonStyles>;
