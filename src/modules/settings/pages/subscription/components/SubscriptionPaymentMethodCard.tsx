import {
  faCreditCard,
  faLink,
  faPlus,
  faShield,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { PaymentSecurityFeature } from './PaymentSecurityFeature';
import {
  ActionItem,
  ActionList,
  ActionPanel,
  ActionPanelDesc,
  ActionPanelTitle,
  BrandBox,
  CardActions,
  CardInfo,
  CardInfoSub,
  CardInfoTitle,
  CardList,
  CardNetBanner,
  CardNetDesc,
  CardNetIconWrap,
  CardNetInfo,
  CardNetTitle,
  DefaultBadge,
  SavedCardRow,
  Section,
  SectionRow,
  SectionTitle,
  SecurityGrid,
  SecuritySection,
  VerifiedBadge,
  Wrapper,
} from './SubscriptionPaymentMethodCard.styles';

import type { SubscriptionViewModel } from '../subscription.types';
import {
  formatDate,
  getStatusLabel,
  resolveSubscriptionProviderLabel,
} from '../subscription.utils';

interface SubscriptionPaymentMethodCardProps {
  subscription: SubscriptionViewModel;
  canManagePayments: boolean;
  portalLoading?: boolean;
  onOpenPortal: () => void | Promise<boolean>;
}

export const SubscriptionPaymentMethodCard = ({
  subscription,
  canManagePayments,
  portalLoading = false,
  onOpenPortal,
}: SubscriptionPaymentMethodCardProps) => {
  const providerLabel = resolveSubscriptionProviderLabel(subscription.provider);

  return (
    <Wrapper>
      <CardNetBanner>
        <CardNetIconWrap>
          <FontAwesomeIcon icon={faShield} />
        </CardNetIconWrap>
        <CardNetInfo>
          <CardNetTitle>
            Método gestionado por {providerLabel}
            <VerifiedBadge>{getStatusLabel(subscription.status)}</VerifiedBadge>
          </CardNetTitle>
          <CardNetDesc>
            La tarjeta principal, altas, reemplazos y eliminación se administran
            desde el portal seguro del proveedor conectado al negocio.
          </CardNetDesc>
        </CardNetInfo>
      </CardNetBanner>

      <Section>
        <SectionRow>
          <SectionTitle>Tarjetas Guardadas</SectionTitle>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faPlus} />}
            disabled={!canManagePayments}
            loading={portalLoading}
            onClick={() => {
              onOpenPortal();
            }}
          >
            Abrir Portal
          </Button>
        </SectionRow>

        <CardList>
          <SavedCardRow $default>
            <BrandBox>
              <FontAwesomeIcon icon={faCreditCard} />
            </BrandBox>
            <CardInfo>
              <CardInfoTitle>
                Método administrado externamente
                <DefaultBadge>Proveedor activo</DefaultBadge>
              </CardInfoTitle>
              <CardInfoSub>
                {providerLabel} - próxima revisión{' '}
                {formatDate(subscription.periodEnd)}
              </CardInfoSub>
            </CardInfo>
            <CardActions>
              <Button
                size="small"
                icon={<FontAwesomeIcon icon={faLink} />}
                disabled={!canManagePayments}
                loading={portalLoading}
                onClick={() => {
                  onOpenPortal();
                }}
              >
                Administrar
              </Button>
            </CardActions>
          </SavedCardRow>

          <SavedCardRow $default={false}>
            <BrandBox>
              <FontAwesomeIcon icon={faTrash} />
            </BrandBox>
            <CardInfo>
              <CardInfoTitle>Cambios soportados desde el portal</CardInfoTitle>
              <CardInfoSub>
                Agregar tarjeta, definir principal, actualizar vencimiento o
                remover un método existente.
              </CardInfoSub>
            </CardInfo>
          </SavedCardRow>
        </CardList>
      </Section>

      <ActionPanel>
        <ActionPanelTitle>Acciones disponibles</ActionPanelTitle>
        <ActionPanelDesc>
          Usa el portal para completar cambios reales sin salir del flujo de
          suscripción del negocio.
        </ActionPanelDesc>
        <ActionList>
          <ActionItem>Agregar o reemplazar la tarjeta principal</ActionItem>
          <ActionItem>Revisar intentos de cobro y reintentar pagos</ActionItem>
          <ActionItem>Actualizar el método del débito automático</ActionItem>
        </ActionList>
        <Button
          type="primary"
          disabled={!canManagePayments}
          loading={portalLoading}
          onClick={() => {
            onOpenPortal();
          }}
        >
          Ir al portal seguro
        </Button>
      </ActionPanel>

      <SecuritySection>
        <SectionTitle>Seguridad de Pagos</SectionTitle>
        <SecurityGrid>
          <PaymentSecurityFeature
            title="Tokenización"
            description="La información del método de pago se administra fuera de la app y no queda expuesta en esta vista."
          />
          <PaymentSecurityFeature
            title="Portal verificado"
            description="Las actualizaciones del método se completan en el entorno seguro del proveedor configurado."
          />
          <PaymentSecurityFeature
            title="Historial centralizado"
            description="Los movimientos y validaciones regresan al historial de billing del negocio."
          />
        </SecurityGrid>
      </SecuritySection>
    </Wrapper>
  );
};

export default SubscriptionPaymentMethodCard;
