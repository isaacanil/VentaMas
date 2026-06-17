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
import { Button, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionContainer,
  BenefitItem,
  BenefitList,
  GlassCard,
  HeaderSection,
  PageWrapper,
  StatusIconContainer,
  StyledAlert,
} from './SubscriptionSuccessPage.styles';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { requestVerifySubscriptionCheckoutSession } from '@/firebase/billing/billingManagement';
import {
  resolveCurrentActiveBusinessId,
  resolveDefaultHomeRoute,
  withBusinessManagerQuery,
} from '@/modules/auth/public';
import ROUTES_NAME from '@/router/routes/routesName';

import { formatLimit } from './subscription.utils';
import { useSubscriptionData } from './useSubscriptionData';

type VerificationState =
  | 'idle'
  | 'verifying'
  | 'paid'
  | 'failed'
  | 'void'
  | 'pending';

type VerificationSnapshot = {
  state: VerificationState;
  message: string | null;
};

const FALLBACK_HIGHLIGHTS = [
  {
    icon: faLayerGroup,
    title: 'Mas capacidad',
    value: 'Nuevos topes operativos disponibles',
  },
  {
    icon: faChartLine,
    title: 'Crecimiento activo',
    value: 'Tu cuenta ya puede escalar sin bloqueos',
  },
  {
    icon: faStar,
    title: 'Gestion centralizada',
    value: 'Checkout y portal listos para futuras gestiones',
  },
];

const normalizeVerificationState = (
  rawStatus: string | null,
): VerificationState => {
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
  const billingResult =
    searchParams.get('billingResult')?.trim().toLowerCase() || null;
  const needsCardnetVerification =
    provider === 'cardnet' && Boolean(orderNumber);
  const [verification, setVerification] = useState<VerificationSnapshot>(
    () => ({
      state: resolveInitialState({ provider, orderNumber, billingResult }),
      message: null,
    }),
  );

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
              ? 'CardNET confirmo el pago y la suscripcion fue actualizada.'
              : nextState === 'pending'
                ? 'CardNET todavia no confirma un resultado final para esta sesion.'
                : 'CardNET devolvio un resultado no exitoso para esta sesion.'),
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
  }, [
    activeBusinessId,
    handleLoadOverview,
    needsCardnetVerification,
    orderNumber,
  ]);

  const verificationState = verification.state;
  const verificationMessage = verification.message;

  const statusConfig = useMemo(() => {
    if (verificationState === 'verifying') {
      return {
        tagColor: 'processing',
        tagLabel: 'Verificando pago',
        title: 'Validando transaccion',
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
        description:
          'No se aplicaron cambios. Por favor, verifica tu metodo de pago.',
        icon: faTriangleExclamation,
        themeColor: verificationState === 'void' ? '#eab308' : '#ef4444',
      };
    }

    return {
      tagColor: 'green',
      tagLabel: '',
      title: 'Suscripcion activada',
      description: '',
      icon: faCircleCheck,
      themeColor: '#10b981',
    };
  }, [verificationState]);

  const successPlanLabel =
    subscription.displayName || subscription.planId || 'Premium';

  const benefits = useMemo(() => {
    const resolvedRows = limitRows
      .filter((row) => row.limit != null)
      .slice(0, 3)
      .map((row, index) => ({
        icon: index === 0 ? faLayerGroup : index === 1 ? faChartLine : faStar,
        label: row.label,
        value: formatLimit(row.limit),
      }));

    return resolvedRows.length > 0
      ? resolvedRows
      : FALLBACK_HIGHLIGHTS.map((fallback) => ({
          icon: fallback.icon,
          label: fallback.title,
          value: fallback.value,
        }));
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
          <Tag
            color={statusConfig.tagColor}
            style={{ borderRadius: '12px', padding: '0 12px' }}
          >
            {statusConfig.tagLabel}
          </Tag>
        ) : null}

        <HeaderSection>
          <Typography.Title
            level={2}
            style={{ margin: '16px 0 8px', fontWeight: 700 }}
          >
            {statusConfig.title}
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{
              display: 'block',
              maxWidth: '400px',
              margin: '0 auto',
              fontSize: '16px',
            }}
          >
            {verificationState === 'paid'
              ? `Tu plan ${successPlanLabel} ya esta activo y listo para usar.`
              : statusConfig.description}
          </Typography.Text>
        </HeaderSection>

        {verificationMessage && verificationState !== 'paid' && (
          <StyledAlert type="warning" message={verificationMessage} showIcon />
        )}

        {verificationState === 'paid' && (
          <BenefitList>
            {benefits.map((benefit) => (
              <BenefitItem key={`${benefit.label}-${benefit.value}`}>
                <span className="icon-box">
                  <FontAwesomeIcon icon={benefit.icon} />
                </span>
                <span className="text-box">
                  <span className="label">{benefit.label}</span>
                  <span className="value">{benefit.value}</span>
                </span>
              </BenefitItem>
            ))}
          </BenefitList>
        )}

        <ActionContainer>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleGoHome}
            style={{
              height: '52px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Ir al Dashboard
          </Button>
          <Button
            type="text"
            size="large"
            block
            onClick={handleGoToSubscription}
            loading={loading === 'reload'}
            style={{ color: '#64748b', fontWeight: 500 }}
          >
            Detalles de suscripcion
            <FontAwesomeIcon
              icon={faArrowRight}
              style={{ marginLeft: 8, fontSize: '12px' }}
            />
          </Button>
        </ActionContainer>
      </GlassCard>
    </PageWrapper>
  );
};

export default SubscriptionSuccessPage;
