import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DateTime } from 'luxon';
import React from 'react';

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
      color: '#52c41a',
      bgColor: '#f6ffed',
      icon: <CheckCircleOutlined />,
      text: 'Completado',
    },
    pending: {
      color: '#faad14',
      bgColor: '#fffbe6',
      icon: <ClockCircleOutlined />,
      text: 'Pendiente',
    },
    canceled: {
      color: '#ff4d4f',
      bgColor: '#fff2f0',
      icon: <CloseCircleOutlined />,
      text: 'Cancelado',
    },
    processing: {
      color: '#1890ff',
      bgColor: '#e6f7ff',
      icon: <SyncOutlined spin />,
      text: 'En Proceso',
    },
    default: {
      color: '#8c8c8c',
      bgColor: '#fafafa',
      icon: null,
      text: 'Desconocido',
    },
  },
  dates: {
    overdue: {
      color: '#cf1322',
      bgColor: '#fff1f0',
      icon: <CloseCircleOutlined />,
      text: 'Vencido',
    },
    today: {
      color: '#096dd9',
      bgColor: '#e6f7ff',
      icon: <SyncOutlined />,
      text: 'Hoy',
    },
    warning: {
      color: '#d48806',
      bgColor: '#fff7e6',
      icon: <WarningOutlined />,
      text: 'Próximo',
    },
    upcoming: {
      color: '#389e0d',
      bgColor: '#f6ffed',
      icon: <ClockCircleOutlined />,
      text: 'Cercano',
    },
    onTime: {
      color: '#389e0d',
      bgColor: '#f6ffed',
      icon: <CheckCircleOutlined />,
      text: 'En tiempo',
    },
    invalid: {
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      icon: <CalendarOutlined />,
      text: 'Sin fecha',
    },
    default: {
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      icon: <CalendarOutlined />,
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
    if (typeof value?.toDate === 'function') {
      return DateTime.fromJSDate(value.toDate());
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
