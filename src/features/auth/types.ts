export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}
