export const theme = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#6200EE',
    secondary: '#03DAC6',
    error: '#B00020',
    success: '#4CAF50',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    border: '#E0E0E0',
    textSecondary: '#757575',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    primary: '#BB86FC',
    secondary: '#03DAC6',
    error: '#CF6679',
    success: '#81C784',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    border: '#333333',
    textSecondary: '#B0B0B0',
  },
};

export type Theme = typeof theme.light;
