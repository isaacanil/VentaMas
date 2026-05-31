import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

import {
  ActiveBadge,
  BillingNote,
  PlanActions,
  PlanAmount,
  PlanCard,
  PlanDesc,
  PlanInfo,
  PlanName,
  PlanPeriod,
  PlanPrice,
  PlanTitleRow,
} from './SubscriptionOverviewCard.styles';

interface SubscriptionPlanSummaryProps {
  billingCycle: string | null;
  canManagePayments: boolean;
  displayName: string | null;
  nextChargeLabel: string;
  priceLabel: string;
  providerLabel: string;
  statusLabel: string;
  statusTone: 'active' | 'warning' | 'danger';
  onChangePlan: () => void;
}

export const SubscriptionPlanSummary = ({
  billingCycle,
  canManagePayments,
  displayName,
  nextChargeLabel,
  priceLabel,
  providerLabel,
  statusLabel,
  statusTone,
  onChangePlan,
}: SubscriptionPlanSummaryProps) => (
  <PlanCard>
    <PlanInfo>
      <PlanTitleRow>
        <PlanName>{displayName || 'Sin plan asignado'}</PlanName>
        <ActiveBadge $tone={statusTone}>{statusLabel}</ActiveBadge>
      </PlanTitleRow>
      <PlanDesc>
        {`Proveedor ${providerLabel} - ciclo ${billingCycle || 'mensual'}`}
      </PlanDesc>
      <PlanPrice>
        <PlanAmount>{priceLabel}</PlanAmount>
        <PlanPeriod>/mes</PlanPeriod>
      </PlanPrice>
    </PlanInfo>
    <PlanActions>
      <Button
        type="primary"
        icon={<FontAwesomeIcon icon={faArrowRight} />}
        iconPosition="end"
        disabled={!canManagePayments}
        onClick={onChangePlan}
      >
        Cambiar Plan
      </Button>
      <BillingNote>Próxima facturación: {nextChargeLabel}</BillingNote>
    </PlanActions>
  </PlanCard>
);
