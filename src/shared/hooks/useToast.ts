import React, { useState, useEffect, useCallback } from 'react';
import { ToastConfig } from '../components/Toast';

let toastTimeout: NodeJS.Timeout | null = null;
let toastState: ToastConfig | null = null;
let toastListeners: Set<(toast: ToastConfig | null) => void> = new Set();

const notifyListeners = () => {
  toastListeners.forEach(listener => listener(toastState));
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Suscribirse a cambios de toast
  useEffect(() => {
    const listener = (newToast: ToastConfig | null) => {
      setToast(newToast);
    };
    
    toastListeners.add(listener);
    listener(toastState); // Estado inicial
    
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    // Limpiar timeout anterior si existe
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastState = config;
    notifyListeners();

    // Limpiar después de la duración
    const duration = config.duration || 3000;
    toastTimeout = setTimeout(() => {
      toastState = null;
      notifyListeners();
      toastTimeout = null;
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    toastState = null;
    notifyListeners();
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
