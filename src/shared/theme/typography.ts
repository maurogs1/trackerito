import { TextStyle } from 'react-native';

// Tipografía unificada para toda la aplicación
// Basada en el análisis de las 17 pantallas existentes

export const typography = {
  // Títulos de página
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  } as TextStyle,

  // Títulos de sección dentro de una página
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,

  // Subtítulos y descripciones secundarias
  subtitle: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  } as TextStyle,

  // Texto principal de contenido
  body: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  } as TextStyle,

  // Texto con énfasis (nombres, items importantes)
  bodyBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,

  // Labels de formularios e inputs
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,

  // Texto pequeño para detalles, fechas, metadata
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  } as TextStyle,

  // Caption con énfasis
  captionBold: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,

  // Texto muy pequeño (badges, tags)
  small: {
    fontSize: 10,
    fontWeight: 'normal',
    lineHeight: 14,
  } as TextStyle,

  // Montos grandes destacados (balances principales)
  amountLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  } as TextStyle,

  // Montos medianos (totales de sección)
  amountMedium: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  } as TextStyle,

  // Montos en listas y cards
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  } as TextStyle,

  // Texto de botones
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,

  // Texto de botones pequeños
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,
};

export type Typography = typeof typography;
