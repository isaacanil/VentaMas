import {
  faArrowUpRightFromSquare,
  faFlaskVial,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
            la suscripción.
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

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InlineNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid rgb(148 163 184 / 20%);
  background: #ffffff;
`;

const InlineNoticeText = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
`;
