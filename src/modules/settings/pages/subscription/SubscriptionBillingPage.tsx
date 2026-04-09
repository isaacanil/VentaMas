import { SubscriptionBillingCard } from './components/SubscriptionBillingCard';
import { useSubscriptionPageContext } from './useSubscriptionPageContext';

const SubscriptionBillingPage = () => {
  const { subscription, paymentRows, canManagePayments, loadingAction, handleOpenPortal } =
    useSubscriptionPageContext();

  return (
    <SubscriptionBillingCard
      subscription={subscription}
      paymentRows={paymentRows}
      canManagePayments={canManagePayments}
      portalLoading={loadingAction === 'portal'}
      onOpenPortal={() => {
        void handleOpenPortal();
      }}
    />
  );
};

export default SubscriptionBillingPage;
