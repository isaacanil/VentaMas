import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  TooltipContent,
  TooltipDivider,
  TooltipModuleItem,
  TooltipModuleList,
  TooltipRow,
  TooltipRowIcon,
  TooltipRowLabel,
  TooltipRows,
  TooltipRowValue,
  TooltipSectionTitle,
} from './DeveloperSubscriptionPlanCardTooltip.styles';
import {
  formatLimitValue,
  PREVIEW_LIMIT_KEYS,
} from './DeveloperSubscriptionPlanCard.helpers';
import { ENTITLEMENT_LABELS } from '../subscriptionEntitlements';
import type { UnknownRecord } from '../subscription.types';

interface PlanTooltipContentProps {
  limits: UnknownRecord;
  allEntitlements: [string, unknown][];
}

export const PlanTooltipContent = ({
  limits,
  allEntitlements,
}: PlanTooltipContentProps) => (
  <TooltipContent>
    <TooltipSectionTitle>Limites</TooltipSectionTitle>
    <TooltipRows>
      {PREVIEW_LIMIT_KEYS.map(({ key, label, icon }) => (
        <TooltipRow key={key}>
          <TooltipRowIcon>{icon}</TooltipRowIcon>
          <TooltipRowLabel>{label}</TooltipRowLabel>
          <TooltipRowValue>{formatLimitValue(limits[key])}</TooltipRowValue>
        </TooltipRow>
      ))}
    </TooltipRows>
    {allEntitlements.length > 0 && (
      <>
        <TooltipDivider />
        <TooltipSectionTitle>Modulos habilitados</TooltipSectionTitle>
        <TooltipModuleList>
          {allEntitlements.map(([key]) => (
            <TooltipModuleItem key={key}>
              <FontAwesomeIcon icon={faCheck} />
              {ENTITLEMENT_LABELS[key] ?? key}
            </TooltipModuleItem>
          ))}
        </TooltipModuleList>
      </>
    )}
  </TooltipContent>
);
