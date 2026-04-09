import { SubscriptionPaymentMethodCard } from './components/SubscriptionPaymentMethodCard';
import { useSubscriptionPageContext } from './useSubscriptionPageContext';

const SubscriptionPaymentMethodPage = () => {
  const { subscription, canManagePayments, loadingAction, handleOpenPortal } =
    useSubscriptionPageContext();

  return (
    <SubscriptionPaymentMethodCard
      subscription={subscription}
      canManagePayments={canManagePayments}
      portalLoading={loadingAction === 'portal'}
      onOpenPortal={() => {
        void handleOpenPortal();
      }}
    />
  );
};

export default SubscriptionPaymentMethodPage;
