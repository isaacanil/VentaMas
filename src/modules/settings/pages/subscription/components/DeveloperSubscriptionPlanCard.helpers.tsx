import {
  faBox,
  faFileInvoice,
  faInfinity,
  faStore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';

import { Muted } from './DeveloperSubscriptionPlanCard.styles';
import { toFiniteNumber } from '../subscription.utils';
import type { UnknownRecord } from '../subscription.types';

export const PREVIEW_LIMIT_KEYS: Array<{
  key: string;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: 'maxBusinesses',
    label: 'Negocios',
    icon: <FontAwesomeIcon icon={faStore} />,
  },
  {
    key: 'maxUsers',
    label: 'Usuarios',
    icon: <FontAwesomeIcon icon={faUsers} />,
  },
  {
    key: 'maxProducts',
    label: 'Productos',
    icon: <FontAwesomeIcon icon={faBox} />,
  },
  {
    key: 'maxMonthlyInvoices',
    label: 'Facturas/mes',
    icon: <FontAwesomeIcon icon={faFileInvoice} />,
  },
];

export const formatPlanPrice = (amount: number | null): string => {
  if (!amount) return 'Gratis';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatLimitValue = (value: unknown): ReactNode => {
  const num = toFiniteNumber(value);
  if (num === null) return <Muted>-</Muted>;
  if (num < 0)
    return <FontAwesomeIcon icon={faInfinity} style={{ color: '#0f766e' }} />;
  return num.toLocaleString('es-DO');
};

export const getBadgeLabel = (status: string | null) => {
  if (status === 'active') return 'Activa';
  if (status === 'deprecated') return 'Deprecada';
  if (status === 'retired') return 'Retirada';
  if (status === 'scheduled') return 'Programada';
  if (status === 'draft') return 'Borrador';
  return status || 'Sin estado';
};

export const getEnabledEntitlements = (source: UnknownRecord) =>
  Object.entries(source).filter(([, value]) => value === true);

export const truncateVersionId = (id: string): string => {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
};
