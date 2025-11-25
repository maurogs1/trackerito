import { User } from '@supabase/supabase-js';

export type { User };

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}
