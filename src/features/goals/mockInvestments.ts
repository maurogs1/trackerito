export interface Investment {
  id: string;
  name: string;
  type: 'fci' | 'fixed_term' | 'stock' | 'crypto';
  returnRate: number; // Annual Percentage Rate (TNA)
  risk: 'low' | 'medium' | 'high';
  minTerm: number; // Days
  currency: 'ARS' | 'USD';
  description: string;
}

export const INVESTMENTS: Investment[] = [
  { 
    id: '1', 
    name: 'FCI MercadoPago', 
    type: 'fci', 
    returnRate: 85, 
    risk: 'low', 
    minTerm: 0,
    currency: 'ARS',
    description: 'Dinero disponible siempre. Ideal para gastos del mes.'
  },
  { 
    id: '2', 
    name: 'Plazo Fijo Banco Nación', 
    type: 'fixed_term', 
    returnRate: 110, 
    risk: 'low', 
    minTerm: 30,
    currency: 'ARS',
    description: 'Bloquea tu dinero 30 días para ganar más interés.'
  },
  { 
    id: '3', 
    name: 'Plazo Fijo UVA', 
    type: 'fixed_term', 
    returnRate: 180, // Simulated high return due to inflation
    risk: 'medium', 
    minTerm: 90,
    currency: 'ARS',
    description: 'Le gana a la inflación. Mínimo 90 días.'
  },
  { 
    id: '4', 
    name: 'SPY (S&P 500)', 
    type: 'stock', 
    returnRate: 15, // USD return
    risk: 'high', 
    minTerm: 365,
    currency: 'USD',
    description: 'Invierte en las 500 empresas más grandes de EE.UU.'
  },
  { 
    id: '5', 
    name: 'Bitcoin', 
    type: 'crypto', 
    returnRate: 120, // Volatile
    risk: 'high', 
    minTerm: 365,
    currency: 'USD',
    description: 'Alta volatilidad. Potencial de ganancias extremas.'
  },
];
