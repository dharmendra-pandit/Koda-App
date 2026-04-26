import { create } from 'zustand';
import { ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  actions: AlertAction[];
  icon?: ReactNode;
  
  showAlert: (params: {
    title: string;
    message: string;
    type?: AlertType;
    actions?: AlertAction[];
    icon?: ReactNode;
  }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  actions: [],

  showAlert: ({ title, message, type = 'info', actions = [{ text: 'OK' }], icon }) => {
    set({ visible: true, title, message, type, actions, icon });
  },

  hideAlert: () => {
    set({ visible: false });
  },
}));
