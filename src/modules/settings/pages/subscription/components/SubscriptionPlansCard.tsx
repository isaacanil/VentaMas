import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBox,
  faCartShopping,
  faCheck,
  faCreditCard,
  faFileInvoice,
  faInfinity,
  faMinus,
  faStore,
  faTag,
  faTruck,
  faUserCheck,
  faUsers,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Empty, Modal } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { SUBSCRIPTION_FIELD_CONTRACT } from '../subscriptionFieldCatalog';
import type { SubscriptionPlanOption } from '../subscription.types';
import { asRecord, formatLimit, formatMoney, toFiniteNumber } from '../subscription.utils';

const LIMIT_ICON_MAP: Record<string, IconDefinition> = {
  maxBusinesses: faStore,
  maxUsers: faUsers,
  maxProducts: faBox,
  maxMonthlyInvoices: faFileInvoice,
  maxClients: faUserCheck,
  maxSuppliers: faTruck,
  maxWarehouses: faWarehouse,
  maxOpenCashRegisters: faCartShopping,
};

const LIMIT_DEFINITIONS = Object.values(SUBSCRIPTION_FIELD_CONTRACT.limits).sort(
  (left, right) => left.defaultOrder - right.defaultOrder,
);

const FEATURE_DEFINITIONS = [
  ...Object.values(SUBSCRIPTION_FIELD_CONTRACT.modules),
  ...Object.values(SUBSCRIPTION_FIELD_CONTRACT.addons),
].sort((left, right) => left.defaultOrder - right.defaultOrder);

interface SubscriptionPlansCardProps {
  plans: SubscriptionPlanOption[];
  currentPlanId?: string | null;
  onSelectPlan: (planId: string) => void | Promise<void>;
  loadingAction?: boolean;
  canManagePayments?: boolean;
  providerLabel?: string;
}

const resolvePlanDescription = (plan: SubscriptionPlanOption) => {
  if (plan.planCode === 'demo') {
    return 'Demo inicial asignada durante el onboarding. No admite una nueva selección.';
  }
  if (plan.planCode === 'legacy') {
    return 'Plan heredado por migración. Se conserva como referencia, pero no admite nuevas altas.';
  }
  return 'Configuración activa del catálogo comercial.';
};

const resolvePlanTone = (plan: SubscriptionPlanOption) => {
  if (plan.isCurrent) return 'current';
  if (plan.isSelectable) return 'selectable';
  return 'locked';
};

const isFeatureEnabled = (plan: SubscriptionPlanOption, key: string) =>
  asRecord(plan.modules)[key] === true || asRecord(plan.addons)[key] === true;

export const SubscriptionPlansCard = ({
  plans,
  currentPlanId,
  onSelectPlan,
  loadingAction = false,
  canManagePayments = false,
  providerLabel = 'CardNET',
}: SubscriptionPlansCardProps) => {
  const [confirmPlanId, setConfirmPlanId] = useState<string | null>(null);

  const displayedPlans = useMemo(
    () =>
      plans.slice().sort((left, right) => {
        if (left.isCurrent && !right.isCurrent) return -1;
        if (!left.isCurrent && right.isCurrent) return 1;
        const leftPrice = toFiniteNumber(left.priceMonthly) ?? 0;
        const rightPrice = toFiniteNumber(right.priceMonthly) ?? 0;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;
        return left.displayName.localeCompare(right.displayName, 'es');
      }),
    [plans],
  );

  const comparisonLimitRows = useMemo(
    () =>
      LIMIT_DEFINITIONS.filter((definition) =>
        displayedPlans.some(
          (plan) => toFiniteNumber(asRecord(plan.limits)[definition.key]) !== null,
        ),
      ),
    [displayedPlans],
  );

  const comparisonFeatureRows = useMemo(
    () =>
      FEATURE_DEFINITIONS.filter((definition) =>
        displayedPlans.some((plan) => isFeatureEnabled(plan, definition.key)),
      ),
    [displayedPlans],
  );

  const selectedPlan =
    displayedPlans.find((plan) => plan.planCode === confirmPlanId) || null;

  const handleConfirm = async () => {
    if (!confirmPlanId) return;
    await onSelectPlan(confirmPlanId);
    setConfirmPlanId(null);
  };

  if (!displayedPlans.length) {
    return (
      <Wrapper>
        <Empty
          description="No hay planes comerciales disponibles para este negocio."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <PlansGrid>
        {displayedPlans.map((plan) => {
          const isCurrent = plan.planCode === currentPlanId || plan.isCurrent;
          const tone = resolvePlanTone(plan);
          const limitRows = comparisonLimitRows.map((definition) => ({
            key: definition.key,
            label: definition.defaultLabel,
            icon: LIMIT_ICON_MAP[definition.key] || faTag,
            value: toFiniteNumber(asRecord(plan.limits)[definition.key]),
          }));
          const featureRows = comparisonFeatureRows.map((definition) => ({
            key: definition.key,
            label: definition.defaultLabel,
            included: isFeatureEnabled(plan, definition.key),
          }));

          return (
            <PlanCard key={plan.planCode} $tone={tone}>
              <PlanCardHeader>
                <PlanCardMeta>
                  <PlanCardName>{plan.displayName}</PlanCardName>
                  {isCurrent && <CurrentBadge>Plan actual</CurrentBadge>}
                  {!isCurrent && plan.isSelectable && <SelectableBadge>Disponible</SelectableBadge>}
                </PlanCardMeta>
                <PlanCardDesc>{resolvePlanDescription(plan)}</PlanCardDesc>
              </PlanCardHeader>

              <PlanCardBody>
                <PriceBlock>
                  <PriceAmount>{formatMoney(plan.priceMonthly, plan.currency)}</PriceAmount>
                  <PricePeriod>/mes</PricePeriod>
                </PriceBlock>

                <LimitSection>
                  <SectionLabel>Límites</SectionLabel>
                  {limitRows.map((limit) => (
                    <LimitRow key={`${plan.planCode}-${limit.key}`}>
                      <LimitLeft>
                        <LimitIcon>
                          <FontAwesomeIcon icon={limit.icon} />
                        </LimitIcon>
                        <LimitLabel>{limit.label}</LimitLabel>
                      </LimitLeft>
                      <LimitValue $unlimited={limit.value != null && limit.value < 0}>
                        {limit.value != null && limit.value < 0 ? (
                          <FontAwesomeIcon icon={faInfinity} />
                        ) : (
                          formatLimit(limit.value)
                        )}
                      </LimitValue>
                    </LimitRow>
                  ))}
                </LimitSection>

                {featureRows.length > 0 && (
                  <>
                    <Divider />
                    <LimitSection>
                      <SectionLabel>Módulos y addons</SectionLabel>
                      {featureRows.map((feature) => (
                        <FeatureRow
                          key={`${plan.planCode}-${feature.key}`}
                          $included={feature.included}
                        >
                          <FeatureIcon $included={feature.included}>
                            <FontAwesomeIcon icon={feature.included ? faCheck : faMinus} />
                          </FeatureIcon>
                          <span>{feature.label}</span>
                        </FeatureRow>
                      ))}
                    </LimitSection>
                  </>
                )}

                <SelectButton
                  type={!isCurrent && plan.isSelectable ? 'primary' : 'default'}
                  disabled={isCurrent || !plan.isSelectable || !canManagePayments}
                  loading={loadingAction && confirmPlanId === plan.planCode}
                  onClick={() => setConfirmPlanId(plan.planCode)}
                  block
                >
                  {isCurrent
                    ? 'Plan actual'
                    : !plan.isSelectable
                      ? 'No disponible'
                      : canManagePayments
                        ? 'Seleccionar plan'
                        : 'Solo owner/admin'}
                </SelectButton>
              </PlanCardBody>
            </PlanCard>
          );
        })}
      </PlansGrid>

      <ComparisonCard>
        <ComparisonTitle>Comparación detallada</ComparisonTitle>
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <Th $left>Recurso</Th>
                {displayedPlans.map((plan) => (
                  <Th key={plan.planCode} $current={plan.planCode === currentPlanId || plan.isCurrent}>
                    <span>{plan.displayName}</span>
                    {(plan.planCode === currentPlanId || plan.isCurrent) && (
                      <InlineCurrentBadge>Actual</InlineCurrentBadge>
                    )}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonLimitRows.map((definition, index) => (
                <Tr key={definition.key} $even={index % 2 === 0}>
                  <Td>
                    <LimitLeft>
                      <LimitIcon>
                        <FontAwesomeIcon icon={LIMIT_ICON_MAP[definition.key] || faTag} />
                      </LimitIcon>
                      <strong>{definition.defaultLabel}</strong>
                    </LimitLeft>
                  </Td>
                  {displayedPlans.map((plan) => {
                    const numericValue = toFiniteNumber(asRecord(plan.limits)[definition.key]);
                    return (
                      <Td key={`${plan.planCode}-${definition.key}`} $center>
                        <TableValue $unlimited={numericValue != null && numericValue < 0}>
                          {numericValue != null && numericValue < 0 ? (
                            <FontAwesomeIcon icon={faInfinity} />
                          ) : (
                            formatLimit(numericValue)
                          )}
                        </TableValue>
                      </Td>
                    );
                  })}
                </Tr>
              ))}
              {comparisonFeatureRows.length > 0 && (
                <SubheaderRow>
                  <td colSpan={displayedPlans.length + 1}>
                    <SubheaderLabel>Módulos y addons</SubheaderLabel>
                  </td>
                </SubheaderRow>
              )}
              {comparisonFeatureRows.map((definition, index) => (
                <Tr key={definition.key} $even={index % 2 === 0}>
                  <Td>
                    <strong>{definition.defaultLabel}</strong>
                  </Td>
                  {displayedPlans.map((plan) => {
                    const included = isFeatureEnabled(plan, definition.key);
                    return (
                      <Td key={`${plan.planCode}-${definition.key}`} $center>
                        {included ? (
                          <CheckIcon>
                            <FontAwesomeIcon icon={faCheck} />
                          </CheckIcon>
                        ) : (
                          <MinusIcon>
                            <FontAwesomeIcon icon={faMinus} />
                          </MinusIcon>
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </ComparisonCard>

      <Modal
        open={confirmPlanId !== null}
        onCancel={() => setConfirmPlanId(null)}
        footer={null}
        closable={!loadingAction}
        width={440}
        centered
      >
        <ModalBody>
          <ModalTitle>Confirmar cambio de plan</ModalTitle>
          <ModalDesc>
            Vas a cambiar al plan <strong>{selectedPlan?.displayName}</strong> por{' '}
            <strong>
              {selectedPlan
                ? formatMoney(selectedPlan.priceMonthly, selectedPlan.currency)
                : 'No definido'}
              /mes
            </strong>
            .
          </ModalDesc>

          <PaymentInfo>
            <PaymentIconWrapper>
              <FontAwesomeIcon icon={faCreditCard} />
            </PaymentIconWrapper>
            <PaymentInfoText>
              <PaymentMethod>Se redirigirá a {providerLabel}</PaymentMethod>
              <PaymentCard>El cambio se confirma desde el checkout seguro.</PaymentCard>
            </PaymentInfoText>
          </PaymentInfo>

          <ModalActions>
            <Button onClick={() => setConfirmPlanId(null)} disabled={loadingAction}>
              Cancelar
            </Button>
            <Button type="primary" loading={loadingAction} onClick={() => void handleConfirm()}>
              Confirmar cambio
            </Button>
          </ModalActions>
        </ModalBody>
      </Modal>
    </Wrapper>
  );
};

export default SubscriptionPlansCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
`;

const PlanCard = styled.section<{ $tone: 'current' | 'selectable' | 'locked' }>`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 14px;
  border: 1px solid
    ${(props) =>
      props.$tone === 'current'
        ? 'rgb(13 148 136 / 35%)'
        : props.$tone === 'selectable'
          ? 'rgb(59 130 246 / 24%)'
          : '#e2e8f0'};
  background:
    ${(props) =>
      props.$tone === 'current'
        ? 'linear-gradient(180deg, rgb(240 253 250) 0%, #ffffff 24%)'
        : '#ffffff'};
  overflow: hidden;
`;

const PlanCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 12px;
`;

const PlanCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const PlanCardName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
`;

const CurrentBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  background: rgb(13 148 136 / 8%);
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 700;
`;

const SelectableBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgb(59 130 246 / 22%);
  background: rgb(59 130 246 / 8%);
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
`;

const PlanCardDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.55;
`;

const PlanCardBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding: 0 18px 18px;
`;

const PriceBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const PriceAmount = styled.span`
  color: #0f172a;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1;
`;

const PricePeriod = styled.span`
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LimitSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionLabel = styled.span`
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const LimitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const LimitLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LimitIcon = styled.span`
  width: 16px;
  color: #64748b;
  text-align: center;
`;

const LimitLabel = styled.span`
  color: #374151;
  font-size: 0.84rem;
`;

const LimitValue = styled.span<{ $unlimited: boolean }>`
  color: ${(props) => (props.$unlimited ? '#0f766e' : '#0f172a')};
  font-size: 0.84rem;
  font-weight: 700;
`;

const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

const FeatureRow = styled.div<{ $included: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.$included ? '#374151' : '#cbd5e1')};
  font-size: 0.84rem;
`;

const FeatureIcon = styled.span<{ $included: boolean }>`
  width: 16px;
  color: ${(props) => (props.$included ? '#0f766e' : '#cbd5e1')};
  text-align: center;
`;

const SelectButton = styled(Button)`
  margin-top: auto;
`;

const ComparisonCard = styled.section`
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
`;

const ComparisonTitle = styled.h3`
  margin: 0;
  padding: 18px 20px 14px;
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
`;

const TableWrapper = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
`;

const Th = styled.th<{ $left?: boolean; $current?: boolean }>`
  padding: 10px 18px;
  text-align: ${(props) => (props.$left ? 'left' : 'center')};
  color: ${(props) => (props.$current ? '#0f766e' : '#64748b')};
  font-weight: 600;
  white-space: nowrap;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  > span {
    display: block;
    margin-bottom: ${(props) => (props.$current ? '4px' : '0')};
  }
`;

const InlineCurrentBadge = styled.span`
  display: inline-block;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid rgb(13 148 136 / 25%);
  color: #0f766e;
  font-size: 0.68rem;
  font-weight: 700;
`;

const Tr = styled.tr<{ $even: boolean }>`
  background: ${(props) => (props.$even ? '#f8fafc' : 'transparent')};
  border-bottom: 1px solid #f1f5f9;
`;

const Td = styled.td<{ $center?: boolean }>`
  padding: 10px 18px;
  color: #374151;
  text-align: ${(props) => (props.$center ? 'center' : 'left')};
  vertical-align: middle;
`;

const TableValue = styled.span<{ $unlimited: boolean }>`
  color: ${(props) => (props.$unlimited ? '#0f766e' : '#0f172a')};
  font-weight: 700;
`;

const CheckIcon = styled.span`
  color: #0f766e;
`;

const MinusIcon = styled.span`
  color: #cbd5e1;
`;

const SubheaderRow = styled.tr`
  background: #f1f5f9;

  td {
    padding: 8px 18px;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const SubheaderLabel = styled.span`
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.04rem;
  font-weight: 700;
`;

const ModalDesc = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
`;

const PaymentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const PaymentIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
`;

const PaymentInfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PaymentMethod = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 600;
`;

const PaymentCard = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
