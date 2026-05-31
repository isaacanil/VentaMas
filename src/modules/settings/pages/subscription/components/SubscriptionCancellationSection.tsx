import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal } from 'antd';
import { useState } from 'react';

import type { SubscriptionViewModel } from '../subscription.types';
import { formatDate } from '../subscription.utils';
import {
  CancelConfirmBody,
  CancelConfirmDesc,
  CancelConfirmFooter,
  CancelConfirmIcon,
  CancelConfirmTitle,
  CancelDoneBody,
  CancelDoneDesc,
  CancelDoneIcon,
  CancelDoneTitle,
  CardHeader,
  CardTitle,
  DangerBody,
  DangerCard,
  DangerInfo,
  DangerInfoDesc,
  DangerInfoTitle,
} from './SubscriptionSettingsCard.styles';

type CancelStep = 'confirm' | 'done';

interface SubscriptionCancellationSectionProps {
  canManagePayments: boolean;
  portalLoading: boolean;
  providerLabel: string;
  subscription: SubscriptionViewModel;
  onOpenPortal: () => void | Promise<boolean>;
}

export const SubscriptionCancellationSection = ({
  canManagePayments,
  portalLoading,
  providerLabel,
  subscription,
  onOpenPortal,
}: SubscriptionCancellationSectionProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancelStep>('confirm');

  const openCancel = () => {
    setCancelStep('confirm');
    setShowCancelModal(true);
  };

  const closeCancel = () => {
    if (cancelStep === 'done') return;
    setShowCancelModal(false);
    setCancelStep('confirm');
  };

  const handleOpenCancellationPortal = async () => {
    const opened = await Promise.resolve(onOpenPortal());
    if (!opened) return;
    setCancelStep('done');
    window.setTimeout(() => {
      setShowCancelModal(false);
      setCancelStep('confirm');
    }, 2200);
  };

  return (
    <>
      <DangerCard>
        <CardHeader>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            style={{ color: '#dc2626' }}
          />
          <CardTitle>Cancelar Plan</CardTitle>
        </CardHeader>
        <DangerBody>
          <DangerInfo>
            <DangerInfoTitle>Cancelar Suscripción</DangerInfoTitle>
            <DangerInfoDesc>
              La cancelación final se completa en el portal del proveedor.
              Mantendrás acceso hasta {formatDate(subscription.periodEnd)}.
            </DangerInfoDesc>
          </DangerInfo>
          <Button danger disabled={!canManagePayments} onClick={openCancel}>
            Cancelar Suscripción
          </Button>
        </DangerBody>
      </DangerCard>

      <Modal
        open={showCancelModal}
        onCancel={closeCancel}
        footer={null}
        title={cancelStep === 'confirm' ? 'Cancelar Suscripción' : null}
        width={440}
        mask={{ closable: cancelStep !== 'done' }}
        closable={cancelStep !== 'done'}
      >
        {cancelStep === 'done' && (
          <CancelDoneBody>
            <CancelDoneIcon>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </CancelDoneIcon>
            <CancelDoneTitle>Portal abierto</CancelDoneTitle>
            <CancelDoneDesc>
              Completa la cancelación desde el portal seguro. El acceso actual
              se mantiene hasta {formatDate(subscription.periodEnd)}.
            </CancelDoneDesc>
          </CancelDoneBody>
        )}

        {cancelStep === 'confirm' && (
          <CancelConfirmBody>
            <CancelConfirmIcon>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </CancelConfirmIcon>
            <CancelConfirmTitle>Continuar en portal seguro</CancelConfirmTitle>
            <CancelConfirmDesc>
              Abriremos {providerLabel} para que confirmes la cancelación real
              de la suscripción.
            </CancelConfirmDesc>
            <CancelConfirmFooter>
              <Button onClick={closeCancel}>Volver</Button>
              <Button
                danger
                type="primary"
                disabled={!canManagePayments}
                loading={portalLoading}
                onClick={() => {
                  void handleOpenCancellationPortal();
                }}
              >
                Abrir portal
              </Button>
            </CancelConfirmFooter>
          </CancelConfirmBody>
        )}
      </Modal>
    </>
  );
};
