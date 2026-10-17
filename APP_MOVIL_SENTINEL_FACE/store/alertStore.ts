import { create } from 'zustand';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertState {
  visible: boolean;
  options: AlertOptions | null;
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  options: null,
  showAlert: (options) => set({ visible: true, options }),
  hideAlert: () => set({ visible: false, options: null }),
}));

/**
 * customAlert
 * Helper global para disparar una alerta personalizada con el mismo API básico que Alert.alert de React Native.
 */
export function customAlert(title: string, message?: string, buttons?: AlertButton[]) {
  useAlertStore.getState().showAlert({ title, message, buttons });
}
