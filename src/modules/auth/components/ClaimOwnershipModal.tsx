import { Button, Modal, notification } from 'antd';
import { useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  resolveCurrentActiveBusinessId,
  resolveCurrentActiveRole,
} from '@/modules/auth/utils/businessContext';
import { hasBusinessOwnershipClaimIssueAccess } from '@/utils/access/businessOwnershipClaimIssueAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import {
  copyClaimLinkToClipboard,
  generateOwnershipClaimLink,
} from './ClaimOwnershipModal.utils';
import {
  claimOwnershipReducer,
  createInitialClaimOwnershipState,
  setClaimOwnershipDismissed,
} from './ClaimOwnershipModal.state';

interface ClaimOwnershipModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ClaimOwnershipModal = ({
  isOpen,
  onClose,
}: ClaimOwnershipModalProps = {}) => {
  const canClaimBusinessOwnership =
    isFrontendFeatureEnabled('businessCreation');
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

  const [state, dispatchState] = useReducer(
    claimOwnershipReducer,
    undefined,
    createInitialClaimOwnershipState,
  );
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

  const isControlled = typeof isOpen === 'boolean';
  const open =
    canClaimBusinessOwnership &&
    shouldPrompt &&
    (isControlled ? Boolean(isOpen) : !dismissed);

  const handleDismiss = () => {
    if (!isControlled) {
      setClaimOwnershipDismissed();
      dispatchState({ type: 'dismiss' });
    }
    onClose?.();
  };

  const handleCopyLink = () => {
    if (!claimUrl) return;
    void copyClaimLinkToClipboard(claimUrl).then((copiedToClipboard) => {
      if (copiedToClipboard) {
        notification.success({
          title: 'Enlace copiado',
          description:
            'Comparte este enlace con quien deba reclamar el negocio.',
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
      title="Propiedad del negocio"
      onCancel={handleDismiss}
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
            Cerrar
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
            Generar enlace
          </Button>
        ),
      ]}
    >
      <p>
        Este negocio no tiene un propietario registrado. Puedes generar un
        enlace de reclamo de un solo uso cuando vayas a asignarlo.
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
