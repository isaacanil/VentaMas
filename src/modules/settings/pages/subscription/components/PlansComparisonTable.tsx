import {
  faCheck,
  faInfinity,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { SubscriptionPlanOption } from '../subscription.types';
import { asRecord, formatLimit, toFiniteNumber } from '../subscription.utils';
import {
  FALLBACK_LIMIT_ICON,
  LIMIT_ICON_MAP,
  isFeatureEnabled,
  type PlanComparisonDefinition,
} from './SubscriptionPlansCard.helpers';
import {
  ComparisonCard,
  ComparisonTitle,
  TableWrapper,
  Th,
  InlineCurrentBadge,
  Tr,
  Td,
  LimitLeft,
  LimitIcon,
  TableValue,
  CheckIcon,
  MinusIcon,
  SubheaderRow,
  SubheaderLabel,
} from './SubscriptionPlansCard.styles';

interface PlansComparisonTableProps {
  plans: SubscriptionPlanOption[];
  currentPlanId?: string | null;
  limitDefinitions: PlanComparisonDefinition[];
  featureDefinitions: PlanComparisonDefinition[];
}

export const PlansComparisonTable = ({
  plans,
  currentPlanId,
  limitDefinitions,
  featureDefinitions,
}: PlansComparisonTableProps) => (
  <ComparisonCard>
    <ComparisonTitle>Comparación detallada</ComparisonTitle>
    <TableWrapper>
      <table>
        <thead>
          <tr>
            <Th $left>Recurso</Th>
            {plans.map((plan) => (
              <Th
                key={plan.planCode}
                $current={plan.planCode === currentPlanId || plan.isCurrent}
              >
                <span>{plan.displayName}</span>
                {(plan.planCode === currentPlanId || plan.isCurrent) && (
                  <InlineCurrentBadge>Actual</InlineCurrentBadge>
                )}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {limitDefinitions.map((definition, index) => (
            <Tr key={definition.key} $even={index % 2 === 0}>
              <Td>
                <LimitLeft>
                  <LimitIcon>
                    <FontAwesomeIcon
                      icon={
                        LIMIT_ICON_MAP[definition.key] || FALLBACK_LIMIT_ICON
                      }
                    />
                  </LimitIcon>
                  <strong>{definition.defaultLabel}</strong>
                </LimitLeft>
              </Td>
              {plans.map((plan) => {
                const numericValue = toFiniteNumber(
                  asRecord(plan.limits)[definition.key],
                );
                return (
                  <Td key={`${plan.planCode}-${definition.key}`} $center>
                    <TableValue
                      $unlimited={numericValue != null && numericValue < 0}
                    >
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
          {featureDefinitions.length > 0 && (
            <SubheaderRow>
              <td colSpan={plans.length + 1}>
                <SubheaderLabel>Módulos y addons</SubheaderLabel>
              </td>
            </SubheaderRow>
          )}
          {featureDefinitions.map((definition, index) => (
            <Tr key={definition.key} $even={index % 2 === 0}>
              <Td>
                <strong>{definition.defaultLabel}</strong>
              </Td>
              {plans.map((plan) => {
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
);
