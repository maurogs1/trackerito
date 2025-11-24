import { Bank, Benefit } from './types';

export const formatBenefitDays = (days: number[]) => {
  if (days.length === 7) return 'Todos los días';
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days.map(d => dayNames[d]).join(', ');
};

export const BANKS: Bank[] = [
  { id: 'galicia', name: 'Banco Galicia', color: '#FA4616', logo: 'business' },
  { id: 'santander', name: 'Santander', color: '#EC0000', logo: 'business' },
  { id: 'bbva', name: 'BBVA', color: '#004481', logo: 'business' },
  { id: 'nacion', name: 'Banco Nación', color: '#006289', logo: 'business' },
  { id: 'macro', name: 'Banco Macro', color: '#003678', logo: 'business' },
  { id: 'hsbc', name: 'HSBC', color: '#DB0011', logo: 'business' },
  { id: 'icbc', name: 'ICBC', color: '#C4161C', logo: 'business' },
];

export const BENEFITS: Benefit[] = [
  // Galicia
  { id: '1', bankId: 'galicia', description: '25% en Coto', discountPercentage: 25, days: [4], category: 'Supermercado' }, // Thursday
  { id: '2', bankId: 'galicia', description: '15% en YPF', discountPercentage: 15, days: [1], category: 'Combustible' }, // Monday
  { id: 'g1', bankId: 'galicia', description: '30% en Starbucks', discountPercentage: 30, days: [0, 1, 2, 3, 4, 5, 6], category: 'Cafetería', cardLevelRequired: 'black' }, // Everyday Black

  // Santander
  { id: '3', bankId: 'santander', description: '20% en Carrefour', discountPercentage: 20, days: [3], category: 'Supermercado' }, // Wednesday
  { id: '4', bankId: 'santander', description: '30% en Cines', discountPercentage: 30, days: [5, 6], category: 'Entretenimiento' }, // Fri, Sat
  { id: 's1', bankId: 'santander', description: '25% en Farmacity', discountPercentage: 25, days: [2], category: 'Farmacia' }, // Tuesday

  // BBVA
  { id: '5', bankId: 'bbva', description: '20% en Axion', discountPercentage: 20, days: [2, 0], category: 'Combustible' }, // Tuesday, Sunday
  { id: 'b1', bankId: 'bbva', description: '30% en PedidosYa', discountPercentage: 30, days: [4, 5], category: 'Delivery' }, // Thu, Fri

  // Nacion
  { id: '6', bankId: 'nacion', description: '20% en Carnicerías', discountPercentage: 20, days: [6], category: 'Alimentos' }, // Saturday
  { id: '7', bankId: 'nacion', description: '10% en Farmacias', discountPercentage: 10, days: [1, 2, 3, 4, 5], category: 'Salud' }, // Weekdays
  { id: 'n1', bankId: 'nacion', description: '35% en Tienda BNA', discountPercentage: 35, days: [1, 2, 3], category: 'Shopping', cardLevelRequired: 'gold' }, // Mon-Wed Gold

  // Macro
  { id: 'm1', bankId: 'macro', description: '25% en Rappi', discountPercentage: 25, days: [3], category: 'Delivery' }, // Wed

  // HSBC
  { id: 'h1', bankId: 'hsbc', description: '20% en Jumbo', discountPercentage: 20, days: [5, 6, 0], category: 'Supermercado' }, // Fri-Sun

  // ICBC
  { id: 'i1', bankId: 'icbc', description: '30% en Moda', discountPercentage: 30, days: [5, 6], category: 'Indumentaria' }, // Fri, Sat
];
