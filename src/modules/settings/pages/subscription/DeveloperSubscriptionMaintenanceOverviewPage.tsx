import {
  faArrowUpRightFromSquare,
  faFlaskVial,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  InlineNotice,
  InlineNoticeText,
  PageContent,
} from './DeveloperSubscriptionMaintenancePage.styles';

import ROUTES_NAME from '@/router/routes/routesName';

import SubscriptionCurrentPlanCard from './components/SubscriptionCurrentPlanCard';
import SubscriptionLimitsCard from './components/SubscriptionLimitsCard';
import SubscriptionPaymentHistoryCard from './components/SubscriptionPaymentHistoryCard';
import { useDeveloperSubscriptionMaintenanceContext } from './useDeveloperSubscriptionMaintenanceContext';

const DeveloperSubscriptionMaintenanceOverviewPage = () => {
  const navigate = useNavigate();
  const {
    activeBusinessId,
    loading,
    subscription,
    statusTone,
    limitRows,
    paymentRows,
    handleLoadOverview,
  } = useDeveloperSubscriptionMaintenanceContext();

  return (
    <PageContent>
      <SubscriptionCurrentPlanCard
        subscription={subscription}
        statusTone={statusTone}
        helperText="Toma este snapshot como base antes de correr simulaciones o abrir herramientas internas."
        primaryActionLabel="Ir a simulaciones"
        primaryActionIcon={<FontAwesomeIcon icon={faFlaskVial} />}
        onPrimaryAction={() =>
          navigate(ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE_SANDBOX)
        }
        secondaryActionLabel="Abrir resumen publico"
        secondaryActionIcon={
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        }
        onSecondaryAction={() =>
          navigate(ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE)
        }
      />

      {!activeBusinessId ? (
        <InlineNotice>
          <InlineNoticeText>
            Selecciona un negocio para ver limites, historial y estado real de
            la suscripcion.
          </InlineNoticeText>
          <Button
            size="small"
            disabled={loading === 'reload'}
            onClick={() => {
              void handleLoadOverview();
            }}
          >
            Reintentar
          </Button>
        </InlineNotice>
      ) : null}

      <SubscriptionLimitsCard limitRows={limitRows} />
      <SubscriptionPaymentHistoryCard paymentRows={paymentRows} />
    </PageContent>
  );
};

export default DeveloperSubscriptionMaintenanceOverviewPage;
