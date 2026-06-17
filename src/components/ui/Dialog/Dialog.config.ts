import type { ReactNode } from 'react';

import { icons } from '@/constants/icons/icons';
import type { DialogType } from '@/context/Dialog/contextState';

export interface DialogThemeStyles {
  background: string;
  border: string;
  text: string;
  button: string;
  buttonHover: string;
  iconBg: string;
}

export const dialogTheme: Record<DialogType, DialogThemeStyles> = {
  error: {
    background: '#FFF5F5',
    border: '#FFA5A5',
    text: '#DC2626',
    button: '#EF4444',
    buttonHover: '#DC2626',
    iconBg: 'rgba(239, 68, 68, 0.1)',
  },
  warning: {
    background: '#FFFBEB',
    border: '#FCD34D',
    text: '#D97706',
    button: '#F59E0B',
    buttonHover: '#D97706',
    iconBg: 'rgba(245, 158, 11, 0.1)',
  },
  success: {
    background: '#F0FDF4',
    border: '#86EFAC',
    text: '#16A34A',
    button: '#22C55E',
    buttonHover: '#16A34A',
    iconBg: 'rgba(34, 197, 94, 0.1)',
  },
  info: {
    background: '#EFF6FF',
    border: '#93C5FD',
    text: '#2563EB',
    button: '#3B82F6',
    buttonHover: '#2563EB',
    iconBg: 'rgba(59, 130, 246, 0.1)',
  },
  neutro: {
    background: '#F8FAFC',
    border: '#E2E8F0',
    text: '#475569',
    button: '#64748B',
    buttonHover: '#475569',
    iconBg: 'rgba(100, 116, 139, 0.12)',
  },
};

export const iconTypes: Record<DialogType, ReactNode> = {
  warning: icons.types.warning,
  error: icons.types.error,
  success: icons.types.success,
  info: icons.types.info,
  neutro: icons.types.neutro,
};
