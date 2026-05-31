import {
  faBell,
  faEnvelope,
  faShield,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Switch } from 'antd';
import {
  resolveBusinessLabel,
  resolveNcfType,
  resolveTaxId,
} from './SubscriptionSettingsCard.helpers';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FiscalBox,
  FiscalGrid,
  FiscalHeader,
  FiscalKey,
  FiscalRow,
  FiscalTitle,
  FiscalVal,
  PageDesc,
  PageHeader,
  PageHeaderText,
  PageTitle,
  PortalRow,
  ToggleDesc,
  ToggleInfo,
  ToggleLabel,
  ToggleRow,
  Wrapper,
} from './SubscriptionSettingsCard.styles';
import { SubscriptionCancellationSection } from './SubscriptionCancellationSection';

import type { CartSettings } from '@/features/cart/types';

import type { SubscriptionViewModel } from '../subscription.types';
import { resolveSubscriptionProviderLabel } from '../subscription.utils';

interface SubscriptionSettingsCardProps {
  business: unknown;
  billingSettings: CartSettings['billing'];
  canManagePayments: boolean;
  settingsSaving?: boolean;
  subscription: SubscriptionViewModel;
  portalLoading?: boolean;
  onOpenPortal: () => void | Promise<boolean>;
  onUpdateBillingSettings: (setting: Partial<CartSettings['billing']>) => void;
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
  const providerLabel = resolveSubscriptionProviderLabel(subscription.provider);
  const businessLabel = resolveBusinessLabel(business);
  const taxId = resolveTaxId(business);
  const ncfType = resolveNcfType(business);
  const emailNotifications =
    billingSettings.subscriptionEmailNotifications ?? true;
  const paymentReminder = billingSettings.subscriptionPaymentReminder ?? true;

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

      <SubscriptionCancellationSection
        canManagePayments={canManagePayments}
        portalLoading={portalLoading}
        providerLabel={providerLabel}
        subscription={subscription}
        onOpenPortal={onOpenPortal}
      />
    </Wrapper>
  );
};

export default SubscriptionSettingsCard;
