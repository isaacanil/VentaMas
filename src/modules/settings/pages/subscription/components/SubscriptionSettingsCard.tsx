import {
  faBell,
  faEnvelope,
  faShield,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Switch } from 'antd';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';

import type { CartSettings } from '@/features/cart/types';

import type { SubscriptionViewModel } from '../subscription.types';
import {
  asRecord,
  formatDate,
  resolveSubscriptionProviderLabel,
  toCleanString,
} from '../subscription.utils';

type CancelStep = 'confirm' | 'done';

const resolveBusinessLabel = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.name) ||
    toCleanString(nestedBusiness.name) ||
    toCleanString(root.businessName) ||
    toCleanString(nestedBusiness.businessName) ||
    'No disponible'
  );
};

const resolveTaxId = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.rnc) ||
    toCleanString(nestedBusiness.rnc) ||
    toCleanString(root.cedula) ||
    toCleanString(nestedBusiness.cedula) ||
    toCleanString(root.personalID) ||
    toCleanString(nestedBusiness.personalID) ||
    'No disponible'
  );
};

const resolveNcfType = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.ncfType) ||
    toCleanString(nestedBusiness.ncfType) ||
    'No definido'
  );
};

interface SubscriptionSettingsCardProps {
  business: unknown;
  billingSettings: CartSettings['billing'];
  canManagePayments: boolean;
  settingsSaving?: boolean;
  subscription: SubscriptionViewModel;
  portalLoading?: boolean;
  onOpenPortal: () => void | Promise<boolean>;
  onUpdateBillingSettings: (
    setting: Partial<CartSettings['billing']>,
  ) => void;
}

export const SubscriptionSettingsCard = ({
  business,
  billingSettings,
  canManagePayments,
  settingsSaving = false,
  subscription,
  portalLoading = false,
  onOpenPortal,
  onUpdateBillingSettings,
}: SubscriptionSettingsCardProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancelStep>('confirm');
  const providerLabel = resolveSubscriptionProviderLabel(subscription.provider);
  const businessLabel = resolveBusinessLabel(business);
  const taxId = resolveTaxId(business);
  const ncfType = resolveNcfType(business);
  const emailNotifications =
    billingSettings.subscriptionEmailNotifications ?? true;
  const paymentReminder = billingSettings.subscriptionPaymentReminder ?? true;

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
    <Wrapper>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Configuración</PageTitle>
          <PageDesc>Ajusta las preferencias de tu suscripción</PageDesc>
        </PageHeaderText>
      </PageHeader>

      <Card>
        <CardHeader>
          <FontAwesomeIcon icon={faBell} style={{ color: '#0d9488' }} />
          <CardTitle>Notificaciones</CardTitle>
        </CardHeader>
        <CardBody>
          <ToggleRow>
            <ToggleInfo>
              <ToggleLabel htmlFor="email-notif">
                Notificaciones por correo
              </ToggleLabel>
              <ToggleDesc>
                Guarda si deseas ver notificaciones relacionadas a pagos y plan.
              </ToggleDesc>
            </ToggleInfo>
            <Switch
              id="email-notif"
              checked={emailNotifications}
              loading={settingsSaving}
              onChange={(checked) =>
                onUpdateBillingSettings({
                  subscriptionEmailNotifications: checked,
                })
              }
            />
          </ToggleRow>
          <ToggleRow>
            <ToggleInfo>
              <ToggleLabel htmlFor="payment-reminder">
                Recordatorio de pago
              </ToggleLabel>
              <ToggleDesc>
                Controla si deseas mantener visible el aviso previo al cobro.
              </ToggleDesc>
            </ToggleInfo>
            <Switch
              id="payment-reminder"
              checked={paymentReminder}
              loading={settingsSaving}
              onChange={(checked) =>
                onUpdateBillingSettings({
                  subscriptionPaymentReminder: checked,
                })
              }
            />
          </ToggleRow>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <FontAwesomeIcon icon={faEnvelope} style={{ color: '#0d9488' }} />
          <CardTitle>Preferencias de Facturación</CardTitle>
        </CardHeader>
        <CardBody>
          <PortalRow>
            <ToggleInfo>
              <ToggleLabel>Renovación y cobros</ToggleLabel>
              <ToggleDesc>
                La renovación automática y el método de débito se administran
                desde {providerLabel}.
              </ToggleDesc>
            </ToggleInfo>
            <Button
              size="small"
              disabled={!canManagePayments}
              loading={portalLoading}
              onClick={() => {
                onOpenPortal();
              }}
            >
              Abrir portal
            </Button>
          </PortalRow>

          <FiscalBox>
            <FiscalHeader>
              <FontAwesomeIcon icon={faShield} style={{ color: '#0d9488' }} />
              <FiscalTitle>Datos Fiscales</FiscalTitle>
            </FiscalHeader>
            <FiscalGrid>
              <FiscalRow>
                <FiscalKey>RNC / Cédula</FiscalKey>
                <FiscalVal $mono>{taxId}</FiscalVal>
              </FiscalRow>
              <FiscalRow>
                <FiscalKey>Razón Social</FiscalKey>
                <FiscalVal>{businessLabel}</FiscalVal>
              </FiscalRow>
              <FiscalRow>
                <FiscalKey>Tipo NCF</FiscalKey>
                <FiscalVal>{ncfType}</FiscalVal>
              </FiscalRow>
            </FiscalGrid>
            <Button
              size="small"
              style={{ marginTop: 10 }}
              disabled={!canManagePayments}
              loading={portalLoading}
              onClick={() => {
                onOpenPortal();
              }}
            >
              Gestionar cobro y facturación
            </Button>
          </FiscalBox>
        </CardBody>
      </Card>

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
        maskClosable={cancelStep !== 'done'}
        closable={cancelStep !== 'done'}
      >
        {cancelStep === 'done' && (
          <CancelDoneBody>
            <CancelDoneIcon>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </CancelDoneIcon>
            <CancelDoneTitle>Portal abierto</CancelDoneTitle>
            <CancelDoneDesc>
              Completa la cancelación desde el portal seguro. El acceso actual se
              mantiene hasta {formatDate(subscription.periodEnd)}.
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
              Abriremos {providerLabel} para que confirmes la cancelación real de
              la suscripción.
            </CancelConfirmDesc>
            <CancelConfirmFooter>
              <Button onClick={() => setShowCancelModal(false)}>Volver</Button>
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
    </Wrapper>
  );
};

export default SubscriptionSettingsCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageHeaderText = styled.div``;

const PageTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 600;
`;

const PageDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.85rem;
`;

const Card = styled.div`
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

const DangerCard = styled(Card)`
  border-color: rgb(220 38 38 / 25%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PortalRow = styled(ToggleRow)``;

const ToggleInfo = styled.div``;

const ToggleLabel = styled.label`
  display: block;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
`;

const ToggleDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  max-width: 52ch;
`;

const FiscalBox = styled.div`
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

const FiscalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const FiscalTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

const FiscalGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FiscalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const FiscalKey = styled.span`
  color: #64748b;
  font-size: 0.82rem;
`;

const FiscalVal = styled.span<{ $mono?: boolean }>`
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 500;
  ${(p) => p.$mono && 'font-family: monospace;'}
`;

const DangerBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const DangerInfo = styled.div``;

const DangerInfoTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

const DangerInfoDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  max-width: 42ch;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
`;

const CancelDoneBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px 16px;
  text-align: center;
  animation: ${fadeIn} 0.25s ease;
`;

const CancelDoneIcon = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgb(220 38 38 / 10%);
  color: #dc2626;
  font-size: 1.4rem;
`;

const CancelDoneTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 600;
`;

const CancelDoneDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 32ch;
`;

const CancelConfirmBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 4px;
  text-align: center;
`;

const CancelConfirmIcon = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgb(220 38 38 / 10%);
  color: #dc2626;
  font-size: 1.2rem;
`;

const CancelConfirmTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

const CancelConfirmDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 34ch;
`;

const CancelConfirmFooter = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;
