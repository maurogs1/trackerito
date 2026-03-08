import { useState, useEffect } from 'react';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  resolve: (value: boolean) => void;
}

let confirmState: ConfirmConfig | null = null;
let confirmListeners: Set<(config: ConfirmConfig | null) => void> = new Set();

const notifyListeners = () => {
  confirmListeners.forEach(listener => listener(confirmState));
};

export const confirm = (
  title: string,
  message: string,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    confirmState = { title, message, ...options, resolve };
    notifyListeners();
  });
};

export const useConfirm = () => {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  useEffect(() => {
    const listener = (newConfig: ConfirmConfig | null) => setConfig(newConfig);
    confirmListeners.add(listener);
    listener(confirmState);
    return () => { confirmListeners.delete(listener); };
  }, []);

  const handleConfirm = () => {
    config?.resolve(true);
    confirmState = null;
    notifyListeners();
  };

  const handleCancel = () => {
    config?.resolve(false);
    confirmState = null;
    notifyListeners();
  };

  return { config, handleConfirm, handleCancel };
};
