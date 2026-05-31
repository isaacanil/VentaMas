import {
  faCheck,
  faInfinity,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { SubscriptionPlanOption } from '../subscription.types';
import {
  asRecord,
  formatLimit,
  formatMoney,
  toFiniteNumber,
} from '../subscription.utils';
import {
  FALLBACK_LIMIT_ICON,
  LIMIT_ICON_MAP,
  isFeatureEnabled,
  resolvePlanDescription,
  resolvePlanTone,
  type PlanComparisonDefinition,
} from './SubscriptionPlansCard.helpers';
import {
  PlanCard,
  PlanCardHeader,
  PlanCardMeta,
  PlanCardName,
  CurrentBadge,
  SelectableBadge,
  PlanCardDesc,
  PlanCardBody,
  PriceBlock,
  PriceAmount,
  PricePeriod,
  LimitSection,
  SectionLabel,
  LimitRow,
  LimitLeft,
  LimitIcon,
  LimitLabel,
  LimitValue,
  Divider,
  FeatureRow,
  FeatureIcon,
  SelectButton,
} from './SubscriptionPlansCard.styles';

interface PlanOptionCardProps {
  plan: SubscriptionPlanOption;
  currentPlanId?: string | null;
  limitDefinitions: PlanComparisonDefinition[];
  featureDefinitions: PlanComparisonDefinition[];
  canManagePayments: boolean;
  loading: boolean;
  isConfirming: boolean;
  onRequestSelect: (planId: string) => void;
}

export const PlanOptionCard = ({
  plan,
  currentPlanId,
  limitDefinitions,
  featureDefinitions,
  canManagePayments,
  loading,
  isConfirming,
  onRequestSelect,
}: PlanOptionCardProps) => {
  const isCurrent = plan.planCode === currentPlanId || plan.isCurrent;
  const tone = resolvePlanTone(plan);
  const limitRows = limitDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.defaultLabel,
    icon: LIMIT_ICON_MAP[definition.key] || FALLBACK_LIMIT_ICON,
    value: toFiniteNumber(asRecord(plan.limits)[definition.key]),
  }));
  const featureRows = featureDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.defaultLabel,
    included: isFeatureEnabled(plan, definition.key),
  }));

  return (
    <PlanCard $tone={tone}>
      <PlanCardHeader>
        <PlanCardMeta>
          <PlanCardName>{plan.displayName}</PlanCardName>
          {isCurrent && <CurrentBadge>Plan actual</CurrentBadge>}
          {!isCurrent && plan.isSelectable && (
            <SelectableBadge>Disponible</SelectableBadge>
          )}
        </PlanCardMeta>
        <PlanCardDesc>{resolvePlanDescription(plan)}</PlanCardDesc>
      </PlanCardHeader>

      <PlanCardBody>
        <PriceBlock>
          <PriceAmount>
            {formatMoney(plan.priceMonthly, plan.currency)}
          </PriceAmount>
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
                    <FontAwesomeIcon
                      icon={feature.included ? faCheck : faMinus}
                    />
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
          loading={loading && isConfirming}
          onClick={() => onRequestSelect(plan.planCode)}
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
};
