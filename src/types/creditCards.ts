export interface CreditCard {
  id: string;
  user_id: string;
  bank_id: string;
  name: string;
  last_four_digits?: string;
  closing_day?: number;
  payment_due_day?: number;
  color?: string;
  created_at: string;
}

export interface CreditCardPurchase {
  id: string;
  user_id: string;
  credit_card_id: string;
  description: string;
  total_amount: number;
  installments: number;
  first_installment_date: string;
  categoryIds?: string[]; // Múltiples categorías
  created_at: string;
}

export interface CreditCardSummary {
  cardId: string;
  month: number; // 0-11
  year: number;
  totalAmount: number;
  items: CreditCardSummaryItem[];
}

export interface CreditCardSummaryItem {
  purchaseId: string;
  description: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
}
