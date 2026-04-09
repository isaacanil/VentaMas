import { SubscriptionSettingsCard } from './components/SubscriptionSettingsCard';
import { useSubscriptionPageContext } from './useSubscriptionPageContext';

const SubscriptionSettingsPage = () => {
  const {
    business,
    billingSettings,
    canManagePayments,
    settingsSaving,
    subscription,
    loadingAction,
    handleOpenPortal,
    handleUpdateBillingSettings,
  } = useSubscriptionPageContext();

  return (
    <SubscriptionSettingsCard
      business={business}
      billingSettings={billingSettings}
      canManagePayments={canManagePayments}
      settingsSaving={settingsSaving}
      subscription={subscription}
      portalLoading={loadingAction === 'portal'}
      onOpenPortal={() => {
        void handleOpenPortal();
      }}
      onUpdateBillingSettings={(setting) => {
        void handleUpdateBillingSettings(setting);
      }}
    />
  );
};

export default SubscriptionSettingsPage;
