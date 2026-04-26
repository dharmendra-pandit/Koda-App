import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  institution: string;
  year: number | string;
  avatar?: string;
  totalPoints: number;
  level: string;
  followers: string[];
  following: string[];
  isPublic: boolean;
  currentStreak: number;
  longestStreak: number;
  bio?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (token: string, user: User) => {
    await AsyncStorage.setItem('token', token);
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ token: null, user: null, isLoading: false });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      
      const { data } = await api.get('/users/me');
      set({ token, user: data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to load user', error);
      await AsyncStorage.removeItem('token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  updateUser: (data) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  }
}));
