import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { withBusinessManagerQuery } from '@/modules/auth/utils/businessManagerRoute';
import { resolveCurrentActiveBusinessId } from '@/modules/auth/utils/businessContext';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_NAME from '@/router/routes/routesName';

import { DeveloperSubscriptionInactiveNotice } from './components/DeveloperSubscriptionInactiveNotice';
import { DeveloperSubscriptionMaintenanceModals } from './components/DeveloperSubscriptionMaintenanceModals';
import {
  SubscriptionTabbedLayout,
  type SubscriptionTabbedLayoutItem,
} from './components/SubscriptionTabbedLayout';
import {
  getStatusLabel,
  resolveOwnership,
  resolveStatusTone,
} from './subscription.utils';
import {
  saveSubscriptionFieldCatalog,
  useSubscriptionFieldCatalog,
} from './useSubscriptionFieldCatalog';
import { useDeveloperSubscriptionMaintenancePage } from './useDeveloperSubscriptionMaintenancePage';
import { useSubscriptionData } from './useSubscriptionData';

const { SUBSCRIPTION_MAINTENANCE_PLANS } = ROUTES_NAME.DEV_VIEW_TERM;

const DEV_NAV_ITEMS: SubscriptionTabbedLayoutItem[] = [
  {
    path: SUBSCRIPTION_MAINTENANCE_PLANS,
    label: 'Suscripciones',
    icon: faLayerGroup,
  },
] as const;

const DeveloperSubscriptionMaintenancePage = () => {
  const business = useSelector(selectBusinessData);
  const user = useSelector(selectUser);
  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const navigate = useNavigate();

  const {
    overview,
    loading,
    subscription,
    limitRows,
    paymentRows,
    handleLoadOverview,
  } = useSubscriptionData(activeBusinessId, business);

  const ownership = resolveOwnership(business, user);
  const isDeveloper = ownership.isPlatformDev;
  const canManagePayments = ownership.isOwner || ownership.isPlatformDev;
  const subscriptionFieldCatalog = useSubscriptionFieldCatalog(isDeveloper);
  const defaultHomePath = withBusinessManagerQuery(
    resolveDefaultHomeRoute(user),
  );
  const statusTone = resolveStatusTone(subscription.status);
  const statusLabel = getStatusLabel(subscription.status);

  const maintenancePage = useDeveloperSubscriptionMaintenancePage({
    activeBusinessId,
    canManagePayments,
    fieldCatalog: subscriptionFieldCatalog,
    handleLoadOverview,
    isDeveloper,
    limitRows,
    loading,
    overview,
    paymentRows,
    saveFieldCatalog: saveSubscriptionFieldCatalog,
    statusLabel,
    statusTone,
    subscription,
  });

  if (!isDeveloper) {
    return <Navigate to={defaultHomePath} replace />;
  }

  return (
    <SubscriptionTabbedLayout
      sectionName="Suscripciones Dev"
      onBack={() => {
        if (window.history.length > 1) {
          navigate(-1);
          return;
        }
        navigate(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB);
      }}
      items={DEV_NAV_ITEMS}
    >
      {!activeBusinessId ? (
        <DeveloperSubscriptionInactiveNotice
          onGoHome={() => navigate(defaultHomePath)}
        />
      ) : null}

      <Outlet context={maintenancePage.contextValue} />

      <DeveloperSubscriptionMaintenanceModals
        developerTools={maintenancePage.developerTools}
        fieldCatalog={subscriptionFieldCatalog}
        onVersioningPlanSelection={maintenancePage.handleVersioningPlanSelection}
        sandboxContext={{
          activeBusinessId,
          canManagePayments,
          dynamicSimulatedPlans: maintenancePage.contextValue.dynamicSimulatedPlans,
          selectedPlanCode: maintenancePage.contextValue.selectedPlanCode,
          setSelectedPlanCode: maintenancePage.contextValue.setSelectedPlanCode,
          selectedSimulatedPlan: maintenancePage.contextValue.selectedSimulatedPlan,
          mockBusy: maintenancePage.contextValue.mockBusy,
          subscriptionPlanId: subscription.planId,
          subscriptionPriceMonthly: subscription.priceMonthly,
          planOptions: maintenancePage.contextValue.planOptions,
          handleRunMockScenario: maintenancePage.contextValue.handleRunMockScenario,
          handleRunSimulatedCheckout: maintenancePage.contextValue.handleRunSimulatedCheckout,
        }}
      />
    </SubscriptionTabbedLayout>
  );
};

export default DeveloperSubscriptionMaintenancePage;
