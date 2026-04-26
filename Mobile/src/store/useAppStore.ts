import { create } from 'zustand';
import { api } from '../services/api';

interface Subject {
  _id: string;
  title: string;
  color: string;
  isPublic: boolean;
  timeSpent?: number;
}

interface AppState {
  subjects: Subject[];
  isLoadingSubjects: boolean;
  fetchSubjects: () => Promise<void>;
  addSubject: (subject: Subject) => void;
}

export const useAppStore = create<AppState>((set) => ({
  subjects: [],
  isLoadingSubjects: false,

  fetchSubjects: async () => {
    set({ isLoadingSubjects: true });
    try {
      const { data } = await api.get('/subjects');
      set({ subjects: data.data || [], isLoadingSubjects: false });
    } catch (error) {
      console.error('Failed to fetch subjects', error);
      set({ isLoadingSubjects: false });
    }
  },

  addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] }))
}));
