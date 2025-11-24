export interface Budget {
  id: string;
  categoryId: string; // Links to a Category
  limitAmount: number;
  period: 'monthly'; // For now only monthly
}
