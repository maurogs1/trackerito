export type CardLevel = 'classic' | 'gold' | 'platinum' | 'black';
export type CardBrand = 'visa' | 'mastercard' | 'amex';

export interface Bank {
  id: string;
  name: string;
  color: string;
  logo: string; // Icon name
}

export interface UserBank {
  bankId: string;
  cards: {
    brand: CardBrand;
    level: CardLevel;
  }[];
}

export interface Benefit {
  id: string;
  bankId: string;
  description: string;
  discountPercentage: number;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  category: string;
  cardLevelRequired?: CardLevel; // If undefined, applies to all
}
