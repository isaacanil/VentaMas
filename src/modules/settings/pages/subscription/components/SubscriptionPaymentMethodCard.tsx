import {
  faCreditCard,
  faLink,
  faPlus,
  faShield,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import styled from 'styled-components';

import type { SubscriptionViewModel } from '../subscription.types';
import {
  formatDate,
  getStatusLabel,
  resolveSubscriptionProviderLabel,
} from '../subscription.utils';

const SecurityFeature = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <SecurityFeatureBox>
    <SecurityFeatureHeader>
      <FontAwesomeIcon icon={faShield} />
      <SecurityFeatureTitle>{title}</SecurityFeatureTitle>
    </SecurityFeatureHeader>
    <SecurityFeatureDesc>{description}</SecurityFeatureDesc>
  </SecurityFeatureBox>
);

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
                {providerLabel} · próxima revisión {formatDate(subscription.periodEnd)}
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
          <SecurityFeature
            title="Tokenización"
            description="La información del método de pago se administra fuera de la app y no queda expuesta en esta vista."
          />
          <SecurityFeature
            title="Portal verificado"
            description="Las actualizaciones del método se completan en el entorno seguro del proveedor configurado."
          />
          <SecurityFeature
            title="Historial centralizado"
            description="Los movimientos y validaciones regresan al historial de billing del negocio."
          />
        </SecurityGrid>
      </SecuritySection>
    </Wrapper>
  );
};

export default SubscriptionPaymentMethodCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const CardNetBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid rgb(13 148 136 / 20%);
  border-radius: 12px;
  background: #ffffff;
`;

const CardNetIconWrap = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgb(13 148 136 / 10%);
  color: #0d9488;
  font-size: 1.25rem;
`;

const CardNetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const CardNetTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
`;

const VerifiedBadge = styled.span`
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  background: rgb(13 148 136 / 10%);
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 600;
`;

const CardNetDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SavedCardRow = styled.div<{ $default: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid ${(p) => (p.$default ? 'rgb(13 148 136 / 30%)' : '#e2e8f0')};
  border-radius: 12px;
  background: #ffffff;
`;

const BrandBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #0d9488;
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardInfoTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

const DefaultBadge = styled.span`
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 600;
`;

const CardInfoSub = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const ActionPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

const ActionPanelTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

const ActionPanelDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
`;

const ActionList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: #374151;
  font-size: 0.82rem;
  line-height: 1.6;
`;

const ActionItem = styled.li``;

const SecuritySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

const SecurityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const SecurityFeatureBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

const SecurityFeatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0d9488;
  font-size: 0.85rem;
`;

const SecurityFeatureTitle = styled.span`
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 500;
`;

const SecurityFeatureDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.4;
`;
