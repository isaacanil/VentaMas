import { useNavigate } from 'react-router-dom';
import { SubscriptionActivityCard } from './SubscriptionActivityCard';
import {
  resolveDaysRemaining,
  resolveStatusTone,
} from './SubscriptionOverviewCard.helpers';
import {
  Header,
  HeaderDesc,
  HeaderTitle,
  TwoColGrid,
  Wrapper,
} from './SubscriptionOverviewCard.styles';
import { SubscriptionPlanSummary } from './SubscriptionPlanSummary';
import { SubscriptionQuickActionsCard } from './SubscriptionQuickActionsCard';
import { SubscriptionStatsRow } from './SubscriptionStatsRow';
import { SubscriptionUsageSection } from './SubscriptionUsageSection';

import type {
  LimitRow,
  PaymentRow,
  SubscriptionViewModel,
} from '../subscription.types';
import {
  formatDate,
  formatMoney,
  getStatusLabel,
  resolveSubscriptionProviderLabel,
} from '../subscription.utils';
import ROUTES_NAME from '@/router/routes/routesName';

interface SubscriptionOverviewCardProps {
  subscription: SubscriptionViewModel;
  limitRows: LimitRow[];
  paymentRows: PaymentRow[];
  canManagePayments: boolean;
  loading?: boolean;
  portalLoading?: boolean;
  onRefresh: () => void;
  onOpenPortal: () => void | Promise<boolean>;
}

export const SubscriptionOverviewCard = ({
  subscription,
  limitRows,
  paymentRows,
  canManagePayments,
  loading = false,
  portalLoading = false,
  onRefresh,
  onOpenPortal,
}: SubscriptionOverviewCardProps) => {
  const navigate = useNavigate();
  const {
    ACCOUNT_SUBSCRIPTION_PLANS,
    ACCOUNT_SUBSCRIPTION_BILLING,
    ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
    ACCOUNT_SUBSCRIPTION_SETTINGS,
  } = ROUTES_NAME.SETTING_TERM;
  const providerLabel = resolveSubscriptionProviderLabel(subscription.provider);
  const statusLabel = getStatusLabel(subscription.status);
  const statusTone = resolveStatusTone(subscription.status);
  const daysRemaining = resolveDaysRemaining(subscription.periodEnd);
  const nextChargeLabel = formatDate(subscription.periodEnd);
  const priceLabel = formatMoney(
    subscription.priceMonthly,
    subscription.currency || 'DOP',
  );

  const openPlans = () => navigate(ACCOUNT_SUBSCRIPTION_PLANS);
  const openBilling = () => navigate(ACCOUNT_SUBSCRIPTION_BILLING);
  const openPaymentMethods = () =>
    navigate(ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS);
  const openSettings = () => navigate(ACCOUNT_SUBSCRIPTION_SETTINGS);

  return (
    <Wrapper>
      <Header>
        <HeaderTitle>Resumen de Suscripción</HeaderTitle>
        <HeaderDesc>Gestiona tu plan, facturación y métodos de pago</HeaderDesc>
      </Header>

      <SubscriptionPlanSummary
        billingCycle={subscription.billingCycle}
        canManagePayments={canManagePayments}
        displayName={subscription.displayName}
        nextChargeLabel={nextChargeLabel}
        priceLabel={priceLabel}
        providerLabel={providerLabel}
        statusLabel={statusLabel}
        statusTone={statusTone}
        onChangePlan={openPlans}
      />

      <SubscriptionUsageSection
        loading={loading}
        usageRows={limitRows.slice(0, 8)}
        onRefresh={onRefresh}
      />

      <SubscriptionStatsRow
        canManagePayments={canManagePayments}
        daysRemaining={daysRemaining}
        nextChargeLabel={nextChargeLabel}
        noticeWindowDays={subscription.noticeWindowDays}
        portalLoading={portalLoading}
        priceLabel={priceLabel}
        providerLabel={providerLabel}
        onOpenBilling={openBilling}
        onOpenPortal={onOpenPortal}
      />

      <TwoColGrid>
        <SubscriptionActivityCard
          paymentRows={paymentRows.slice(0, 4)}
          onViewAll={openBilling}
        />
        <SubscriptionQuickActionsCard
          onOpenBilling={openBilling}
          onOpenPaymentMethods={openPaymentMethods}
          onOpenPlans={openPlans}
          onOpenSettings={openSettings}
        />
      </TwoColGrid>
    </Wrapper>
  );
};

export default SubscriptionOverviewCard;
