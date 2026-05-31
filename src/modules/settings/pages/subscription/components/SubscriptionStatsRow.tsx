import {
  faCalendarDays,
  faCreditCard,
  faDesktop,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

import {
  ProgressBar,
  ProgressFill,
  StatCard,
  StatCardHeader,
  StatLabel,
  StatMeta,
  StatsRow,
  StatValue,
} from './SubscriptionOverviewCard.styles';

interface SubscriptionStatsRowProps {
  canManagePayments: boolean;
  daysRemaining: number | null;
  nextChargeLabel: string;
  noticeWindowDays: number | null;
  portalLoading: boolean;
  priceLabel: string;
  providerLabel: string;
  onOpenBilling: () => void;
  onOpenPortal: () => void | Promise<boolean>;
}

const resolveCycleProgress = (
  daysRemaining: number | null,
  noticeWindowDays: number | null,
) => {
  if (daysRemaining == null || !noticeWindowDays) return 0;
  return Math.min(
    100,
    Math.round(
      (daysRemaining / Math.max(noticeWindowDays, daysRemaining, 1)) * 100,
    ),
  );
};

export const SubscriptionStatsRow = ({
  canManagePayments,
  daysRemaining,
  nextChargeLabel,
  noticeWindowDays,
  portalLoading,
  priceLabel,
  providerLabel,
  onOpenBilling,
  onOpenPortal,
}: SubscriptionStatsRowProps) => (
  <StatsRow>
    <StatCard>
      <StatCardHeader>
        <StatLabel>Días Restantes</StatLabel>
        <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#0d9488' }} />
      </StatCardHeader>
      <StatValue>{daysRemaining == null ? '--' : daysRemaining}</StatValue>
      <StatMeta>
        {daysRemaining == null
          ? 'Sin ciclo de cobro activo'
          : `Hasta ${nextChargeLabel}`}
      </StatMeta>
      <ProgressBar style={{ marginTop: 12 }}>
        <ProgressFill
          $pct={resolveCycleProgress(daysRemaining, noticeWindowDays)}
          $critical={false}
          $high={false}
        />
      </ProgressBar>
    </StatCard>

    <StatCard>
      <StatCardHeader>
        <StatLabel>Método de Pago</StatLabel>
        <FontAwesomeIcon icon={faCreditCard} style={{ color: '#0d9488' }} />
      </StatCardHeader>
      <StatValue>{providerLabel}</StatValue>
      <StatMeta>Gestionado desde el portal seguro del proveedor</StatMeta>
      <Button
        type="link"
        size="small"
        loading={portalLoading}
        disabled={!canManagePayments}
        style={{
          padding: 0,
          height: 'auto',
          marginTop: 4,
          fontSize: '0.78rem',
        }}
        onClick={() => {
          onOpenPortal();
        }}
      >
        Gestionar
      </Button>
    </StatCard>

    <StatCard>
      <StatCardHeader>
        <StatLabel>Próximo Cobro</StatLabel>
        <FontAwesomeIcon icon={faDesktop} style={{ color: '#0d9488' }} />
      </StatCardHeader>
      <StatValue>{priceLabel}</StatValue>
      <StatMeta>{nextChargeLabel}</StatMeta>
      <Button
        type="link"
        size="small"
        style={{
          padding: 0,
          height: 'auto',
          marginTop: 4,
          fontSize: '0.78rem',
        }}
        onClick={onOpenBilling}
      >
        Ver historial
      </Button>
    </StatCard>
  </StatsRow>
);
