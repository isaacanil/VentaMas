import { Button, Input, Spin, Typography, notification } from 'antd';
import { useEffect, useReducer, useRef, type JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageLayout } from '@/components/layout/PageShell';
import { addUserData, selectAuthReady, selectUser } from '@/features/auth/userSlice';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { redeemBusinessClaim } from './utils/redeemBusinessClaim';

const { Title, Paragraph, Text } = Typography;

const normalizeToken = (value: string): string =>
  value.trim().replace(/\s+/g, '').toUpperCase();

const resolveTokenFromQuery = (search: string): string => {
  const rawToken = new URLSearchParams(search).get('token');
  if (typeof rawToken !== 'string') return '';
  return normalizeToken(rawToken);
};

type ClaimBusinessState = {
  token: string;
  submitting: boolean;
  redirectingHome: boolean;
  feedback: string | null;
  claimedBusinessId: string | null;
};

type ClaimBusinessAction =
  | { type: 'set-token'; value: string }
  | { type: 'set-feedback'; value: string | null }
  | { type: 'start-submit' }
  | { type: 'submit-error'; feedback: string }
  | {
      type: 'claim-success';
      claimedBusinessId: string | null;
      feedback: string;
    };

const createClaimBusinessInitialState = (
  tokenFromQuery: string,
): ClaimBusinessState => ({
  token: tokenFromQuery,
  submitting: false,
  redirectingHome: false,
  feedback: null,
  claimedBusinessId: null,
});

const claimBusinessReducer = (
  state: ClaimBusinessState,
  action: ClaimBusinessAction,
): ClaimBusinessState => {
  switch (action.type) {
    case 'set-token':
      return { ...state, token: action.value };
    case 'set-feedback':
      return { ...state, feedback: action.value };
    case 'start-submit':
      return {
        ...state,
        submitting: true,
        redirectingHome: false,
        feedback: null,
      };
    case 'submit-error':
      return {
        ...state,
        submitting: false,
        feedback: action.feedback,
      };
    case 'claim-success':
      return {
        ...state,
        submitting: false,
        redirectingHome: true,
        feedback: action.feedback,
        claimedBusinessId: action.claimedBusinessId,
      };
    default:
      return state;
  }
};

export const ClaimBusinessPage = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimeoutRef = useRef<number | null>(null);
  const authReady = useSelector(selectAuthReady);
  const user = useSelector(selectUser) as
    | (UserIdentity & Record<string, unknown>)
    | null;

  const tokenFromQuery = resolveTokenFromQuery(location.search);
  const [state, dispatchClaim] = useReducer(
    claimBusinessReducer,
    tokenFromQuery,
    createClaimBusinessInitialState,
  );
  const { token, submitting, redirectingHome, feedback, claimedBusinessId } =
    state;

  const isPlatformDeveloper = hasDeveloperAccess(user);
  const defaultHomePath = resolveDefaultHomeRoute(user);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const canSubmit =
    Boolean(token.trim()) && Boolean(user) && !submitting && !redirectingHome;

  const handleLogin = () => {
    navigate(ROUTES_PATH.AUTH_TERM.LOGIN);
  };

  const handleGoHome = () => {
    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    navigate(defaultHomePath, { replace: true });
  };

  const handleClaim = () => {
    const normalizedToken = normalizeToken(token);
    if (!normalizedToken) {
      dispatchClaim({
        type: 'set-feedback',
        value: 'Ingresa un token de reclamo valido.',
      });
      return;
    }
    if (!user) {
      dispatchClaim({
        type: 'set-feedback',
        value: 'Debes iniciar sesion para reclamar el negocio.',
      });
      return;
    }

    dispatchClaim({ type: 'start-submit' });

    void redeemBusinessClaim({
      isPlatformDeveloper,
      normalizedToken,
    }).then((result) => {
      if (result.status === 'error') {
        dispatchClaim({
          type: 'submit-error',
          feedback: result.errorMessage,
        });
        notification.error({
          title: 'No fue posible reclamar',
          description: result.errorMessage,
        });
        return;
      }

      dispatch(
        addUserData({
          ...(result.keepGlobalDevRole
            ? {}
            : { role: 'admin', activeRole: 'admin' }),
          businessHasOwners: true,
          activeBusinessRole: result.membershipRole,
          ...(result.businessId
            ? {
                businessID: result.businessId,
                businessId: result.businessId,
                activeBusinessId: result.businessId,
                lastSelectedBusinessId: result.businessId,
              }
            : {}),
        }),
      );

      dispatchClaim({
        type: 'claim-success',
        claimedBusinessId: result.businessId,
        feedback: result.feedbackMessage,
      });

      notification.success({
        title: 'Reclamo completado',
        description: result.notificationMessage,
      });

      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate(defaultHomePath, { replace: true });
      }, 1200);
    });
  };

  return (
    <Page>
      <Container>
        <Card>
          <Title level={3}>Reclamar negocio</Title>
          <Paragraph>
            Usa el enlace de reclamo de un solo uso para registrar el propietario
            del negocio.
          </Paragraph>

          {!authReady ? (
            <InlineLoading>
              <Spin size="small" />
              Verificando sesion...
            </InlineLoading>
          ) : !user ? (
            <>
              <Paragraph>
                Debes iniciar sesion antes de reclamar un negocio.
              </Paragraph>
              <Button type="primary" onClick={handleLogin}>
                Iniciar sesion
              </Button>
            </>
          ) : (
            <>
              <Input
                value={token}
                onChange={(event) =>
                  dispatchClaim({
                    type: 'set-token',
                    value: event.target.value.toUpperCase(),
                  })
                }
                placeholder="OWN-XXXXXXXXXX"
                disabled={submitting || redirectingHome}
              />

              <Actions>
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={() => {
                    void handleClaim();
                  }}
                  disabled={!canSubmit}
                >
                  Reclamar negocio
                </Button>
                <Button onClick={handleGoHome} disabled={submitting}>
                  Ir al inicio
                </Button>
              </Actions>

              {submitting || redirectingHome ? (
                <InlineLoading>
                  <Spin size="small" />
                  {submitting
                    ? 'Validando token y reclamando negocio...'
                    : 'Redirigiendo al inicio...'}
                </InlineLoading>
              ) : null}
            </>
          )}

          {tokenFromQuery ? (
            <Paragraph>
              <Text type="secondary">Token detectado en la URL:</Text>{' '}
              <Text code>{tokenFromQuery}</Text>
            </Paragraph>
          ) : null}

          {claimedBusinessId ? (
            <Paragraph>
              <Text type="secondary">Negocio reclamado:</Text>{' '}
              <Text code>{claimedBusinessId}</Text>
            </Paragraph>
          ) : null}

          {feedback ? (
            <FeedbackText>{feedback}</FeedbackText>
          ) : (
            <FeedbackSpacer />
          )}
        </Card>
      </Container>
    </Page>
  );
};

const Page = styled(PageLayout)`
  min-height: 100%;
  overflow: auto;
`;

const Container = styled.div`
  width: min(560px, 92vw);
  margin: 48px auto;
`;

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 10%);
  background: #fff;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const InlineLoading = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #475569;
`;

const FeedbackText = styled(Paragraph)`
  margin-bottom: 0;
`;

const FeedbackSpacer = styled.div`
  min-height: 8px;
`;

export default ClaimBusinessPage;
