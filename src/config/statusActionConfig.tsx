import { DateTime } from 'luxon';
import React from 'react';

import { AppIcon } from '@/components/ui/AppIcon';
import { semantic } from '@/design-system/tokens/semantic';

export interface ConfigItem {
  color: string;
  bgColor?: string;
  icon: React.ReactNode;
  text: string;
}

interface ConfigSection {
  [key: string]: ConfigItem;
  default: ConfigItem;
}

const CONFIG: Record<'statuses' | 'dates', ConfigSection> = {
  statuses: {
    completed: {
      color: semantic.color.state.successText,
      bgColor: semantic.color.state.successSubtle,
      icon: <AppIcon name="circleCheck" tone="success" sizeToken="sm" />,
      text: 'Completado',
    },
    pending: {
      color: semantic.color.state.warningText,
      bgColor: semantic.color.state.warningSubtle,
      icon: <AppIcon name="clock" tone="warning" sizeToken="sm" />,
      text: 'Pendiente',
    },
    canceled: {
      color: semantic.color.state.dangerText,
      bgColor: semantic.color.state.dangerSubtle,
      icon: <AppIcon name="circleXmark" tone="danger" sizeToken="sm" />,
      text: 'Cancelado',
    },
    processing: {
      color: semantic.color.state.infoText,
      bgColor: semantic.color.state.infoSubtle,
      icon: <AppIcon name="spinner" tone="info" sizeToken="sm" spin />,
      text: 'En Proceso',
    },
    default: {
      color: semantic.color.text.secondary,
      bgColor: semantic.color.bg.subtle,
      icon: null,
      text: 'Desconocido',
    },
  },
  dates: {
    overdue: {
      color: semantic.color.state.dangerText,
      bgColor: semantic.color.state.dangerSubtle,
      icon: <AppIcon name="circleXmark" tone="danger" sizeToken="sm" />,
      text: 'Vencido',
    },
    today: {
      color: semantic.color.state.infoText,
      bgColor: semantic.color.state.infoSubtle,
      icon: <AppIcon name="calendarDays" tone="info" sizeToken="sm" />,
      text: 'Hoy',
    },
    warning: {
      color: semantic.color.state.warningText,
      bgColor: semantic.color.state.warningSubtle,
      icon: <AppIcon name="triangleExclamation" tone="warning" sizeToken="sm" />,
      text: 'Próximo',
    },
    upcoming: {
      color: semantic.color.state.successText,
      bgColor: semantic.color.state.successSubtle,
      icon: <AppIcon name="clock" tone="success" sizeToken="sm" />,
      text: 'Cercano',
    },
    onTime: {
      color: semantic.color.state.successText,
      bgColor: semantic.color.state.successSubtle,
      icon: <AppIcon name="circleCheck" tone="success" sizeToken="sm" />,
      text: 'En tiempo',
    },
    invalid: {
      color: semantic.color.text.secondary,
      bgColor: semantic.color.bg.subtle,
      icon: <AppIcon name="calendar" tone="muted" sizeToken="sm" />,
      text: 'Sin fecha',
    },
    default: {
      color: semantic.color.text.secondary,
      bgColor: semantic.color.bg.subtle,
      icon: <AppIcon name="calendar" tone="muted" sizeToken="sm" />,
      text: 'Desconocido',
    },
  },
};

// Función genérica para obtener configuraciones
function getConfigItem(type: keyof typeof CONFIG, key: string): ConfigItem {
  const config = CONFIG[type];
  return config[key as keyof typeof config] || config.default;
}

export const getStatusConfig = (status: string) =>
  getConfigItem('statuses', status);
export const getDateStatusConfig = (status: string) =>
  getConfigItem('dates', status);

export const getDateStatus = (
  date: unknown,
  statuses: ('overdue' | 'today' | 'warning' | 'upcoming' | 'onTime')[] = [
    'overdue',
    'today',
    'warning',
    'upcoming',
    'onTime',
  ],
) => {
  if (!date) return { status: 'invalid', text: 'Sin fecha' };

  const toDateTime = (value: unknown) => {
    if (DateTime.isDateTime(value)) return value;
    if (value instanceof Date) return DateTime.fromJSDate(value);
    if (typeof value === 'number') return DateTime.fromMillis(value);
    if (typeof value === 'string') {
      const iso = DateTime.fromISO(value);
      return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
    }
    if (
      typeof value === 'object' &&
      value &&
      'toDate' in value &&
      typeof (value as { toDate?: () => Date }).toDate === 'function'
    ) {
      return DateTime.fromJSDate((value as { toDate: () => Date }).toDate());
    }
    return null;
  };

  const today = DateTime.local().startOf('day');
  const targetDate = toDateTime(date)?.startOf('day');
  if (!targetDate?.isValid) return { status: 'invalid', text: 'Sin fecha' };
  const daysUntil = Math.floor(targetDate.diff(today, 'days').days);

  if (statuses.includes('overdue') && daysUntil < 0) {
    return { status: 'overdue', text: 'Vencido' };
  }
  if (statuses.includes('today') && daysUntil === 0) {
    return { status: 'today', text: 'Hoy' };
  }
  if (statuses.includes('warning') && daysUntil > 0 && daysUntil <= 3) {
    return { status: 'warning', text: 'Próximo' };
  }
  if (statuses.includes('upcoming') && daysUntil > 3 && daysUntil <= 7) {
    return { status: 'upcoming', text: 'Cercano' };
  }
  if (statuses.includes('onTime') && daysUntil > 7) {
    return { status: 'onTime', text: 'En tiempo' };
  }

  return { status: 'default', text: 'Desconocido' };
};
