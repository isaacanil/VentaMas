import { Alert, Button } from 'antd';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import UpgradeModal from '@/components/paywall/UpgradeModal/UpgradeModal';
import { selectUser } from '@/features/auth/userSlice';
import { withBusinessManagerQuery } from '@/modules/auth/utils/businessManagerRoute';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_NAME from '@/router/routes/routesName';

const SubscriptionConfig = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleOpenOwnerHub = useCallback(() => {
    navigate(withBusinessManagerQuery(resolveDefaultHomeRoute(user)));
  }, [navigate, user]);

  const handleOpenPlans = useCallback(() => {
    navigate(ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE);
  }, [navigate]);

  return (
    <Container>
      <Alert
        type="info"
        showIcon
        title="Centro principal de pagos"
        description="Gestiona negocios, plan y cobros desde el centro de suscripcion sin perder el contexto del negocio owner."
        action={
          <Actions>
            <Button size="small" onClick={() => setUpgradeModalOpen(true)}>
              Ver planes
            </Button>
            <Button size="small" onClick={handleOpenOwnerHub}>
              Ir al centro principal
            </Button>
          </Actions>
        }
      />
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={handleOpenPlans}
        featureName="Modulo de suscripcion"
        limitReason="este modulo no esta incluido o necesita un plan con acceso de owner"
        title="Activa el centro de suscripcion completo"
        description="Desde aqui puedes abrir el centro de planes y gestionar cambios de suscripcion desde la ruta principal."
        upgradeLabel="Mejorar suscripcion"
        benefits={[
          'Abre planes y checkout desde un flujo mas claro.',
          'Mantiene el acceso al centro de suscripcion sin depender de rutas legacy.',
          'Centraliza cambios de plan, pagos y regularizacion en una sola ruta.',
        ]}
      />
    </Container>
  );
};

export default SubscriptionConfig;

const Container = styled.div`
  display: grid;
  gap: 12px;
  max-width: 1000px;
`;

const Actions = styled.div`
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
`;
