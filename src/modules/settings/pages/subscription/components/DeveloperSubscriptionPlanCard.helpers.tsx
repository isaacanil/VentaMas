import {
  faBox,
  faCheck,
  faFileInvoice,
  faInfinity,
  faStore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';

import {
  Muted,
  TooltipContent,
  TooltipDivider,
  TooltipModuleItem,
  TooltipModuleList,
  TooltipRow,
  TooltipRowIcon,
  TooltipRowLabel,
  TooltipRows,
  TooltipRowValue,
  TooltipSectionTitle,
} from './DeveloperSubscriptionPlanCard.styles';
import { ENTITLEMENT_LABELS } from '../subscriptionEntitlements';
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

export const PlanTooltipContent = ({
  limits,
  allEntitlements,
}: {
  limits: UnknownRecord;
  allEntitlements: [string, unknown][];
}) => (
  <TooltipContent>
    <TooltipSectionTitle>Limites</TooltipSectionTitle>
    <TooltipRows>
      {PREVIEW_LIMIT_KEYS.map(({ key, label, icon }) => (
        <TooltipRow key={key}>
          <TooltipRowIcon>{icon}</TooltipRowIcon>
          <TooltipRowLabel>{label}</TooltipRowLabel>
          <TooltipRowValue>{formatLimitValue(limits[key])}</TooltipRowValue>
        </TooltipRow>
      ))}
    </TooltipRows>
    {allEntitlements.length > 0 && (
      <>
        <TooltipDivider />
        <TooltipSectionTitle>Modulos habilitados</TooltipSectionTitle>
        <TooltipModuleList>
          {allEntitlements.map(([key]) => (
            <TooltipModuleItem key={key}>
              <FontAwesomeIcon icon={faCheck} />
              {ENTITLEMENT_LABELS[key] ?? key}
            </TooltipModuleItem>
          ))}
        </TooltipModuleList>
      </>
    )}
  </TooltipContent>
);
