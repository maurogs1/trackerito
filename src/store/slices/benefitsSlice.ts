import { StateCreator } from 'zustand';
import { UserBank } from '../../features/benefits/types';

export interface BenefitsSlice {
  userBanks: UserBank[];
  
  toggleUserBank: (bankId: string) => void;
  updateUserBank: (bankId: string, cards: { brand: 'visa' | 'mastercard' | 'amex'; level: 'classic' | 'gold' | 'platinum' | 'black' }[]) => void;
}

export const createBenefitsSlice: StateCreator<BenefitsSlice> = (set) => ({
  userBanks: [],

  toggleUserBank: (bankId: string) => {
    set((state) => {
      const exists = state.userBanks.find(b => b.bankId === bankId);
      if (exists) {
        return { userBanks: state.userBanks.filter(b => b.bankId !== bankId) };
      } else {
        return { 
          userBanks: [...state.userBanks, { bankId, cards: [{ brand: 'visa', level: 'classic' }] }] 
        };
      }
    });
  },

  updateUserBank: (bankId, cards) => {
    set((state) => ({
      userBanks: state.userBanks.map(b => 
        b.bankId === bankId ? { ...b, cards } : b
      )
    }));
  },
});
