import {
  faCircleCheck,
  faCircleXmark,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { BillingInvoiceStatus } from './SubscriptionBillingCard.types';
import { StatusBadge } from './SubscriptionBillingCard.styles';

const STATUS_CONFIG = {
  pagado: {
    icon: faCircleCheck,
    label: 'Pagado',
    bg: 'rgb(13 148 136 / 10%)',
    color: '#0f766e',
    border: 'rgb(13 148 136 / 25%)',
  },
  pendiente: {
    icon: faClock,
    label: 'Pendiente',
    bg: 'rgb(217 119 6 / 10%)',
    color: '#92400e',
    border: 'rgb(217 119 6 / 25%)',
  },
  fallido: {
    icon: faCircleXmark,
    label: 'Fallido',
    bg: 'rgb(220 38 38 / 10%)',
    color: '#991b1b',
    border: 'rgb(220 38 38 / 20%)',
  },
  cancelado: {
    icon: faCircleXmark,
    label: 'Cancelado',
    bg: 'rgb(226 232 240)',
    color: '#475569',
    border: 'rgb(203 213 225)',
  },
  desconocido: {
    icon: faClock,
    label: 'Sin clasificar',
    bg: 'rgb(241 245 249)',
    color: '#475569',
    border: 'rgb(226 232 240)',
  },
} as const;

export const BillingInvoiceStatusBadge = ({
  status,
}: {
  status: BillingInvoiceStatus;
}) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <StatusBadge $bg={cfg.bg} $color={cfg.color} $border={cfg.border}>
      <FontAwesomeIcon icon={cfg.icon} />
      {cfg.label}
    </StatusBadge>
  );
};
