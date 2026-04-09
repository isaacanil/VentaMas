import { Button, Modal, notification } from 'antd';
import { useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  resolveCurrentActiveBusinessId,
  resolveCurrentActiveRole,
} from '@/modules/auth/utils/businessContext';
import ROUTES_PATH from '@/router/routes/routesName';
import { hasBusinessOwnershipClaimIssueAccess } from '@/utils/access/businessOwnershipClaimIssueAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import {
  copyClaimLinkToClipboard,
  generateOwnershipClaimLink,
} from './ClaimOwnershipModal.utils';

const DISMISS_KEY = 'claimOwnershipDismissed';

const getDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === '1';
};

const setDismissed = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DISMISS_KEY, '1');
};

type ClaimOwnershipState = {
  dismissed: boolean;
  submitting: boolean;
  claimUrl: string | null;
  claimCode: string | null;
  claimExpiresAt: number | null;
};

type ClaimOwnershipAction =
  | { type: 'dismiss' }
  | { type: 'startSubmitting' }
  | { type: 'finishSubmitting' }
  | {
      type: 'setGeneratedClaim';
      claimUrl: string | null;
      claimCode: string | null;
      claimExpiresAt: number | null;
    };

const claimOwnershipReducer = (
  state: ClaimOwnershipState,
  action: ClaimOwnershipAction,
): ClaimOwnershipState => {
  switch (action.type) {
    case 'dismiss':
      return {
        ...state,
        dismissed: true,
      };
    case 'startSubmitting':
      return {
        ...state,
        submitting: true,
      };
    case 'finishSubmitting':
      return {
        ...state,
        submitting: false,
      };
    case 'setGeneratedClaim':
      return {
        ...state,
        claimUrl: action.claimUrl,
        claimCode: action.claimCode,
        claimExpiresAt: action.claimExpiresAt,
      };
    default:
      return state;
  }
};

export const ClaimOwnershipModal = () => {
  const canClaimBusinessOwnership = isFrontendFeatureEnabled('businessCreation');
  const user = useSelector(selectUser) as {
    role?: string;
    activeRole?: string;
    businessHasOwners?: boolean;
    activeBusinessId?: string;
    businessID?: string;
    businessId?: string;
    accessControl?: unknown;
    memberships?: unknown;
    availableBusinesses?: unknown;
  } | null;

  const [state, dispatchState] = useReducer(claimOwnershipReducer, {
    dismissed: getDismissed(),
    submitting: false,
    claimUrl: null,
    claimCode: null,
    claimExpiresAt: null,
  });
  const { dismissed, submitting, claimUrl, claimCode, claimExpiresAt } = state;

  const canManageOwnershipClaim = user
    ? hasBusinessOwnershipClaimIssueAccess(user)
    : false;
  const activeBusinessId = resolveCurrentActiveBusinessId(
    user as Record<string, unknown>,
  );
  const activeRole = resolveCurrentActiveRole(user as Record<string, unknown>);

  const shouldPrompt = Boolean(
    user &&
      canManageOwnershipClaim &&
      user.businessHasOwners === false &&
      activeRole !== 'owner',
  );

  const open = canClaimBusinessOwnership && shouldPrompt && !dismissed;

  const handleDismiss = () => {
    setDismissed();
    dispatchState({ type: 'dismiss' });
  };

  const handleCopyLink = () => {
    if (!claimUrl) return;
    void copyClaimLinkToClipboard(claimUrl).then((copiedToClipboard) => {
      if (copiedToClipboard) {
        notification.success({
          title: 'Enlace copiado',
          description: 'Comparte este enlace con quien deba reclamar el negocio.',
        });
        return;
      }

      notification.error({
        title: 'No se pudo copiar',
        description: 'Copia manualmente el enlace mostrado en pantalla.',
      });
    });
  };

  const handleGenerateClaimLink = () => {
    if (submitting) return;
    if (!activeBusinessId) {
      notification.error({
        title: 'Error',
        description: 'No se pudo resolver el negocio activo.',
      });
      return;
    }

    dispatchState({ type: 'startSubmitting' });
    void generateOwnershipClaimLink(activeBusinessId).then((result) => {
      if (result.status === 'error') {
        notification.error({
          title: 'Error',
          description: result.errorMessage,
        });
        dispatchState({ type: 'finishSubmitting' });
        return;
      }

      dispatchState({
        type: 'setGeneratedClaim',
        claimUrl: result.claimUrl,
        claimCode: result.claimCode,
        claimExpiresAt: result.claimExpiresAt,
      });

      notification.success({
        title: 'Enlace generado',
        description: result.copiedToClipboard
          ? 'Se genero un enlace de reclamo de un solo uso y ya quedo copiado.'
          : 'Se genero un enlace de reclamo de un solo uso y esta listo para compartir.',
      });

      if (!result.copiedToClipboard && result.claimUrl) {
        notification.info({
          title: 'Copia manual',
          description:
            'No se pudo copiar automaticamente; puedes usar el enlace mostrado.',
        });
      }

      dispatchState({ type: 'finishSubmitting' });
    });
  };

  return (
    <Modal
      centered
      open={open}
      title="Actualizacion de Seguridad: Reclamar Propiedad"
      onCancel={handleDismiss}
      maskClosable={false}
      footer={[
        claimUrl ? (
          <Button
            key="copy"
            onClick={() => {
              void handleCopyLink();
            }}
          >
            Copiar enlace
          </Button>
        ) : (
          <Button key="employee" onClick={handleDismiss}>
            Soy un Empleado
          </Button>
        ),
        claimUrl ? (
          <Button
            key="open-link"
            type="primary"
            onClick={() => {
              if (claimUrl) {
                window.open(claimUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Abrir enlace
          </Button>
        ) : (
          <Button
            key="owner"
            type="primary"
            danger
            loading={submitting}
            onClick={() => {
              void handleGenerateClaimLink();
            }}
          >
            Generar enlace de reclamo
          </Button>
        ),
      ]}
    >
      <p>
        Este negocio no tiene un propietario registrado. Para proteger la
        cuenta debes generar un enlace de reclamo de un solo uso y completar el
        proceso desde esa URL.
      </p>

      {claimUrl ? (
        <>
          <p>
            <strong>Enlace:</strong> {claimUrl}
          </p>
          {claimCode ? (
            <p>
              <strong>Codigo:</strong> {claimCode}
            </p>
          ) : null}
          {claimExpiresAt ? (
            <p>
              <strong>Expira:</strong>{' '}
              {new Date(claimExpiresAt).toLocaleString()}
            </p>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
};

export default ClaimOwnershipModal;
