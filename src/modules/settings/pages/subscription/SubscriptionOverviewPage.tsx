import { SubscriptionOverviewCard } from './components/SubscriptionOverviewCard';
import { useSubscriptionPageContext } from './useSubscriptionPageContext';

const SubscriptionOverviewPage = () => {
  const {
    subscription,
    limitRows,
    paymentRows,
    canManagePayments,
    loading,
    loadingAction,
    handleLoadOverview,
    handleOpenPortal,
  } = useSubscriptionPageContext();

  return (
    <SubscriptionOverviewCard
      subscription={subscription}
      limitRows={limitRows}
      paymentRows={paymentRows}
      canManagePayments={canManagePayments}
      loading={loading === 'reload'}
      portalLoading={loadingAction === 'portal'}
      onRefresh={() => {
        void handleLoadOverview();
      }}
      onOpenPortal={() => {
        void handleOpenPortal();
      }}
    />
  );
};

export default SubscriptionOverviewPage;
