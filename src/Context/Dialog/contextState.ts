import { createContext } from 'react';

export const DialogContext = createContext<any>(null as any);

export const initDialog = {
  isOpen: false,
  title: 'Ingresa un titulo',
  type: 'neutro',
  message: 'Ingresa un mensaje',
  onConfirm: null,
  onCancel: null,
};
