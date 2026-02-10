// Theme principal - Colores
export const theme = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#6200EE',
    secondary: '#03DAC6',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    border: '#E0E0E0',
    textSecondary: '#757575',
  },
  dark: {
    background: '#121212',
    text: '#E8E8E8',
    primary: '#7C4DFF',
    secondary: '#448AFF',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    border: '#333333',
    textSecondary: '#9E9E9E',
  },
};

export type Theme = typeof theme.light;

// Re-exportar todo desde un solo lugar
export { typography } from './typography';
export type { Typography } from './typography';

export { spacing, borderRadius, shadows } from './spacing';
export type { Spacing, BorderRadius, Shadows } from './spacing';

export { createCommonStyles } from './commonStyles';
export type { CommonStyles } from './commonStyles';
