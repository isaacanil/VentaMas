import {
  faArrowRight,
  faChartLine,
  faCircleCheck,
  faClockRotateLeft,
  faLayerGroup,
  faStar,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Button, Skeleton, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { requestVerifySubscriptionCheckoutSession } from '@/firebase/billing/billingManagement';
import { withBusinessManagerQuery } from '@/modules/auth/utils/businessManagerRoute';
import { resolveCurrentActiveBusinessId } from '@/modules/auth/utils/businessContext';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_NAME from '@/router/routes/routesName';

import { formatLimit } from './subscription.utils';
import { useSubscriptionData } from './useSubscriptionData';

type VerificationState = 'idle' | 'verifying' | 'paid' | 'failed' | 'void' | 'pending';

type VerificationSnapshot = {
  state: VerificationState;
  message: string | null;
};

const FALLBACK_HIGHLIGHTS = [
  {
    icon: faLayerGroup,
    title: 'Más capacidad',
    value: 'Nuevos topes operativos disponibles',
  },
  {
    icon: faChartLine,
    title: 'Crecimiento activo',
    value: 'Tu cuenta ya puede escalar sin bloqueos',
  },
  {
    icon: faStar,
    title: 'Gestión centralizada',
    value: 'Checkout y portal listos para futuras gestiones',
  },
];

const normalizeVerificationState = (rawStatus: string | null): VerificationState => {
  const status = (rawStatus || '').trim().toLowerCase();
  if (status === 'paid') return 'paid';
  if (status === 'failed') return 'failed';
  if (status === 'void') return 'void';
  if (status === 'pending') return 'pending';
  return 'idle';
};

const resolveInitialState = ({
  provider,
  orderNumber,
  billingResult,
}: {
  provider: string | null;
  orderNumber: string | null;
  billingResult: string | null;
}): VerificationState => {
  if (provider === 'cardnet' && orderNumber) return 'verifying';
  if (billingResult === 'failed') return 'failed';
  if (billingResult === 'canceled') return 'void';
  return 'paid';
};

const SubscriptionSuccessPage = () => {
  const business = useSelector(selectBusinessData);
  const user = useSelector(selectUser);
  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const provider = searchParams.get('provider')?.trim().toLowerCase() || null;
  const orderNumber = searchParams.get('orderNumber');
  const billingResult = searchParams.get('billingResult')?.trim().toLowerCase() || null;
  const needsCardnetVerification = provider === 'cardnet' && Boolean(orderNumber);
  const [verification, setVerification] = useState<VerificationSnapshot>(() => ({
    state: resolveInitialState({ provider, orderNumber, billingResult }),
    message: null,
  }));

  const { loading, subscription, limitRows, handleLoadOverview } =
    useSubscriptionData(activeBusinessId, business);

  useEffect(() => {
    if (!activeBusinessId) return;

    void handleLoadOverview();

    const refreshTimer = window.setTimeout(() => {
      void handleLoadOverview();
    }, 1800);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [activeBusinessId, handleLoadOverview]);

  useEffect(() => {
    if (!activeBusinessId || !needsCardnetVerification || !orderNumber) return;

    let active = true;
    requestVerifySubscriptionCheckoutSession({
      businessId: activeBusinessId,
      orderNumber,
    })
      .then((result) => {
        if (!active) return;
        const nextState = normalizeVerificationState(result.status || null);
        setVerification({
          state: nextState,
          message:
            result.message ||
            (nextState === 'paid'
              ? 'CardNET confirmó el pago y la suscripción fue actualizada.'
              : nextState === 'pending'
                ? 'CardNET todavía no confirma un resultado final para esta sesión.'
                : 'CardNET devolvió un resultado no exitoso para esta sesión.'),
        });
        void handleLoadOverview();
      })
      .catch((error: unknown) => {
        if (!active) return;
        setVerification({
          state: 'failed',
          message:
            error instanceof Error
              ? error.message
              : 'No se pudo verificar el pago con CardNET.',
        });
      });

    return () => {
      active = false;
    };
  }, [activeBusinessId, handleLoadOverview, needsCardnetVerification, orderNumber]);

  const verificationState = verification.state;
  const verificationMessage = verification.message;

  const statusConfig = useMemo(() => {
    if (verificationState === 'verifying') {
      return {
        tagColor: 'processing',
        tagLabel: 'Verificando pago',
        title: 'Validando transacción',
        description: 'Confirmando detalles con la pasarela de pago...',
        icon: faClockRotateLeft,
        themeColor: '#0ea5e9',
      };
    }

    if (verificationState === 'failed' || verificationState === 'void') {
      return {
        tagColor: verificationState === 'void' ? 'gold' : 'red',
        tagLabel: verificationState === 'void' ? 'Cancelado' : 'No confirmado',
        title: 'Pago no procesado',
        description: 'No se aplicaron cambios. Por favor, verifica tu método de pago.',
        icon: faTriangleExclamation,
        themeColor: verificationState === 'void' ? '#eab308' : '#ef4444',
      };
    }

    return {
      tagColor: 'green',
      tagLabel: '',
      title: 'Suscripción activada',
      description: '',
      icon: faCircleCheck,
      themeColor: '#10b981',
    };
  }, [verificationState]);

  const successPlanLabel = subscription.displayName || subscription.planId || 'Premium';

  const benefits = useMemo(() => {
    const resolvedRows = limitRows
      .filter((row) => row.limit != null)
      .slice(0, 3)
      .map((row, index) => ({
        icon: index === 0 ? faLayerGroup : index === 1 ? faChartLine : faStar,
        label: row.label,
        value: formatLimit(row.limit),
      }));

    return resolvedRows.length > 0 ? resolvedRows : FALLBACK_HIGHLIGHTS.map(f => ({ icon: f.icon, label: f.title, value: f.value }));
  }, [limitRows]);

  const handleGoHome = () => {
    navigate(withBusinessManagerQuery(resolveDefaultHomeRoute(user)), {
      replace: true,
    });
  };

  const handleGoToSubscription = () => {
    navigate(ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE, {
      replace: true,
    });
  };

  return (
    <PageWrapper>
      <GlassCard>
        <StatusIconContainer $color={statusConfig.themeColor}>
          <FontAwesomeIcon icon={statusConfig.icon} />
        </StatusIconContainer>

        {statusConfig.tagLabel ? (
          <Tag color={statusConfig.tagColor} style={{ borderRadius: '12px', padding: '0 12px' }}>
            {statusConfig.tagLabel}
          </Tag>
        ) : null}

        <HeaderSection>
          <Typography.Title level={2} style={{ margin: '16px 0 8px', fontWeight: 700 }}>
            {statusConfig.title}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: '16px', display: 'block', maxWidth: '400px', margin: '0 auto' }}>
            {verificationState === 'paid'
              ? `Tu plan ${successPlanLabel} ya está activo y listo para usar.`
              : statusConfig.description}
          </Typography.Text>
        </HeaderSection>

        {verificationMessage && verificationState !== 'paid' && (
          <StyledAlert
            type="warning"
            message={verificationMessage}
            showIcon
          />
        )}

        <ActionContainer>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleGoHome}
            style={{ height: '52px', borderRadius: '14px', fontSize: '16px', fontWeight: 600 }}
          >
            Ir al Dashboard
          </Button>
          <Button
            type="text"
            size="large"
            block
            onClick={handleGoToSubscription}
            style={{ color: '#64748b', fontWeight: 500 }}
          >
            Detalles de suscripción <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8, fontSize: '12px' }} />
          </Button>
        </ActionContainer>
      </GlassCard>
    </PageWrapper>
  );
};

export default SubscriptionSuccessPage;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Permite scroll natural desde arriba */
  padding: 60px 24px;
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #fffbeb 100%);
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;

  &::before {
    content: '';
    position: fixed; /* Cambiado a fixed para que el fondo no se mueva con el scroll */
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 70% 70%, rgba(14, 165, 233, 0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }
`;

const GlassCard = styled.div`
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 40px;
  padding: 56px 40px;
  width: 100%;
  max-width: 520px;
  box-shadow: 
    0 20px 50px -12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const StatusIconContainer = styled.div<{ $color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 24px;
  box-shadow: inset 0 0 0 1px ${props => props.$color}25;
`;

const HeaderSection = styled.div`
  margin-bottom: 32px;
`;

const StyledAlert = styled(Alert)`
  border-radius: 16px;
  margin-bottom: 24px;
  width: 100%;
  text-align: left;
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
`;

const BenefitList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  text-align: left;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.6);
  }

  .icon-box {
    color: #0d9488;
    font-size: 18px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  .text-box {
    display: flex;
    flex-direction: column;
    
    .label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    
    .value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 600;
    }
  }
`;

const ActionContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
