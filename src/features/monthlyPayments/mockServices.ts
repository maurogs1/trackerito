import { PredefinedService } from './types';

// Servicios predefinidos con logos y categorías
export const PREDEFINED_SERVICES: PredefinedService[] = [
  // Servicio "Otros" al principio para que el usuario pueda crear servicios personalizados
  { name: 'Otros', icon: 'add-circle', color: '#9C27B0', category: 'Personalizado' },
  
  // Servicios Públicos - Utilidades
  { name: 'Luz', icon: 'flash', color: '#FFC107', category: 'Servicios Públicos', commonAmount: 8000, commonDay: 15 },
  { name: 'Agua', icon: 'water', color: '#2196F3', category: 'Servicios Públicos', commonAmount: 5000, commonDay: 10 },
  { name: 'Gas', icon: 'flame', color: '#FF5722', category: 'Servicios Públicos', commonAmount: 6000, commonDay: 5 },
  
  // Telecomunicaciones
  { name: 'Internet', icon: 'wifi', color: '#E91E63', category: 'Telecomunicaciones', commonAmount: 6000, commonDay: 10 },
  { name: 'Teléfono', icon: 'call', color: '#00BCD4', category: 'Telecomunicaciones', commonAmount: 3000, commonDay: 15 },
  { name: 'Cable', icon: 'tv', color: '#1976D2', category: 'Telecomunicaciones', commonAmount: 5000, commonDay: 10 },
  { name: 'Celular', icon: 'phone-portrait', color: '#9C27B0', category: 'Telecomunicaciones', commonAmount: 3000, commonDay: 15 },
  
  // Streaming y Entretenimiento
  { name: 'Netflix', icon: 'film', color: '#E50914', category: 'Entretenimiento', commonAmount: 5000, commonDay: 1 },
  { name: 'Disney+', icon: 'film', color: '#113CCF', category: 'Entretenimiento', commonAmount: 1500, commonDay: 1 },
  { name: 'Spotify', icon: 'musical-notes', color: '#1DB954', category: 'Entretenimiento', commonAmount: 900, commonDay: 1 },
  { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000', category: 'Entretenimiento', commonAmount: 600, commonDay: 1 },
  { name: 'Amazon Prime', icon: 'logo-amazon', color: '#FF9900', category: 'Entretenimiento', commonAmount: 700, commonDay: 1 },
  { name: 'HBO Max', icon: 'film', color: '#5F259F', category: 'Entretenimiento', commonAmount: 1000, commonDay: 1 },
  { name: 'Star+', icon: 'logo-youtube', color: '#1CE783', category: 'Entretenimiento', commonAmount: 1500, commonDay: 1 },
  { name: 'Paramount+', icon: 'film', color: '#0074E4', category: 'Entretenimiento', commonAmount: 800, commonDay: 1 },
  { name: 'Apple TV+', icon: 'logo-apple', color: '#000000', category: 'Entretenimiento', commonAmount: 700, commonDay: 1 },
  
  // Software y Nube
  { name: 'Microsoft 365', icon: 'logo-microsoft', color: '#00A4EF', category: 'Software', commonAmount: 1500, commonDay: 1 },
  { name: 'Google Workspace', icon: 'logo-google', color: '#4285F4', category: 'Software', commonAmount: 2000, commonDay: 1 },
  { name: 'Adobe Creative Cloud', icon: 'color-palette', color: '#FF0000', category: 'Software', commonAmount: 8000, commonDay: 1 },
  { name: 'Dropbox', icon: 'cloud', color: '#0061FF', category: 'Software', commonAmount: 1500, commonDay: 1 },
  { name: 'iCloud', icon: 'cloud', color: '#007AFF', category: 'Software', commonAmount: 1000, commonDay: 1 },
  
  // Gimnasios y Fitness
  { name: 'Gimnasio', icon: 'fitness', color: '#E91E63', category: 'Fitness', commonAmount: 12000, commonDay: 1 },
  { name: 'CrossFit', icon: 'barbell', color: '#FF9800', category: 'Fitness', commonAmount: 15000, commonDay: 1 },
  { name: 'Pilates', icon: 'body', color: '#9C27B0', category: 'Fitness', commonAmount: 10000, commonDay: 1 },
  { name: 'Yoga', icon: 'flower', color: '#4CAF50', category: 'Fitness', commonAmount: 8000, commonDay: 1 },
  
  // Seguros
  { name: 'Seguro de Auto', icon: 'car', color: '#2196F3', category: 'Seguros', commonAmount: 25000, commonDay: 5 },
  { name: 'Seguro de Hogar', icon: 'home', color: '#795548', category: 'Seguros', commonAmount: 8000, commonDay: 10 },
  { name: 'Seguro de Vida', icon: 'heart', color: '#E91E63', category: 'Seguros', commonAmount: 5000, commonDay: 15 },
  { name: 'Seguro de Salud', icon: 'medical', color: '#4CAF50', category: 'Seguros', commonAmount: 15000, commonDay: 1 },
  
  // Servicios Financieros
  { name: 'Cuenta Bancaria', icon: 'wallet', color: '#607D8B', category: 'Finanzas', commonAmount: 2000, commonDay: 1 },
  { name: 'Préstamo Personal', icon: 'cash', color: '#FF9800', category: 'Finanzas', commonDay: 5 },
  { name: 'Préstamo Hipotecario', icon: 'home', color: '#795548', category: 'Finanzas', commonDay: 1 },
  
  // Educación
  { name: 'Universidad', icon: 'school', color: '#3F51B5', category: 'Educación', commonAmount: 50000, commonDay: 5 },
  { name: 'Colegio', icon: 'school', color: '#009688', category: 'Educación', commonAmount: 30000, commonDay: 5 },
  { name: 'Cursos Online', icon: 'laptop', color: '#9C27B0', category: 'Educación', commonAmount: 5000, commonDay: 1 },
  { name: 'Idiomas', icon: 'language', color: '#00BCD4', category: 'Educación', commonAmount: 8000, commonDay: 10 },
  
  // Salud y Bienestar
  { name: 'Obra Social', icon: 'medical', color: '#4CAF50', category: 'Salud', commonAmount: 20000, commonDay: 1 },
  { name: 'Prepaga', icon: 'medical', color: '#4CAF50', category: 'Salud', commonAmount: 25000, commonDay: 1 },
  { name: 'Psicólogo', icon: 'person', color: '#9C27B0', category: 'Salud', commonAmount: 8000, commonDay: 15 },
  { name: 'Dentista', icon: 'medical', color: '#00BCD4', category: 'Salud', commonAmount: 5000, commonDay: 20 },
  
  // Otros Servicios
  { name: 'Limpieza', icon: 'sparkles', color: '#00BCD4', category: 'Hogar', commonAmount: 15000, commonDay: 15 },
  { name: 'Jardinería', icon: 'leaf', color: '#4CAF50', category: 'Hogar', commonAmount: 8000, commonDay: 10 },
  { name: 'Alquiler', icon: 'home', color: '#795548', category: 'Hogar', commonAmount: 80000, commonDay: 5 },
  { name: 'Expensas', icon: 'business', color: '#607D8B', category: 'Hogar', commonAmount: 15000, commonDay: 10 },
  { name: 'Patente de Vehículo', icon: 'car', color: '#2196F3', category: 'Vehículos', commonAmount: 30000, commonDay: 1 },
  { name: 'Cuota de Auto', icon: 'car-sport', color: '#F44336', category: 'Vehículos', commonDay: 10 },
  { name: 'Cuota de Moto', icon: 'bicycle', color: '#FF9800', category: 'Vehículos', commonDay: 10 },
];

// Función para buscar servicios
export const searchServices = (query: string): PredefinedService[] => {
  if (!query.trim()) return PREDEFINED_SERVICES;
  
  const lowerQuery = query.toLowerCase();
  return PREDEFINED_SERVICES.filter(service => 
    service.name.toLowerCase().includes(lowerQuery) ||
    service.category.toLowerCase().includes(lowerQuery)
  );
};

// Obtener servicios por categoría
export const getServicesByCategory = (): Record<string, PredefinedService[]> => {
  const grouped: Record<string, PredefinedService[]> = {};
  
  PREDEFINED_SERVICES.forEach(service => {
    if (!grouped[service.category]) {
      grouped[service.category] = [];
    }
    grouped[service.category].push(service);
  });
  
  return grouped;
};

// Categorías disponibles
export const SERVICE_CATEGORIES = [
  'Servicios Públicos',
  'Telecomunicaciones',
  'Entretenimiento',
  'Software',
  'Fitness',
  'Seguros',
  'Finanzas',
  'Educación',
  'Salud',
  'Hogar',
  'Vehículos',
];
