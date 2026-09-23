import { create } from 'zustand';

export interface UserSession {
  role: 'admin' | 'operator';
  userId: number;
  name: string;
  operatorCode?: string;
  token?: string;
}

interface SessionState {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => {
  // Check local storage for persistent session
  const saved = localStorage.getItem('cat_user_session');
  const initialUser: UserSession | null = saved
    ? JSON.parse(saved)
    : {
        role: 'operator',
        userId: 1,
        name: 'Ravi Kumar',
        operatorCode: 'OP-001',
        token: 'operator_jwt_token_1'
      };

  return {
    user: initialUser,
    setUser: (user) => {
      if (user) {
        localStorage.setItem('cat_user_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('cat_user_session');
      }
      set({ user });
    },
    logout: () => {
      localStorage.removeItem('cat_user_session');
      set({ user: null });
    }
  };
});
