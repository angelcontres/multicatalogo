// src/context/toast.ts
import { createContext, useContext } from 'react';

export interface ToastItem {
  id: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return ctx;
};
