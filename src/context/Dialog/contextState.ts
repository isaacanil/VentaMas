import { createContext, type Dispatch, type SetStateAction } from 'react';

export type DialogType = 'error' | 'warning' | 'success' | 'info' | 'neutro';
export type DialogSize = 'small' | 'default' | 'large';

export interface DialogState {
  isOpen: boolean;
  title: string;
  type: DialogType;
  message: string;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;
  size?: DialogSize;
  successMessage?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
}

export interface DialogContextValue {
  dialog: DialogState;
  setDialog: Dispatch<SetStateAction<DialogState>>;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
export const initDialog: DialogState = {
  isOpen: false,
  title: 'Ingresa un titulo',
  type: 'info',
  message: 'Ingresa un mensaje',
  onConfirm: null,
  onCancel: null,
};
