import styled from 'styled-components';

import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';
import { icons } from '@/constants/icons/icons';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

interface HrCommissionPeriodsToolbarProps extends ToolbarComponentProps {
  cutRulesSummary?: string;
  isCutRulesConfigDisabled?: boolean;
  onConfigureCutRules?: () => void;
}

export const HrCommissionPeriodsToolbar = ({
  cutRulesSummary,
  isCutRulesConfigDisabled,
  onConfigureCutRules,
  side = 'left',
}: HrCommissionPeriodsToolbarProps) => {
  if (side !== 'right' || !onConfigureCutRules) {
    return null;
  }

  const tooltipDescription = cutRulesSummary
    ? `Configurar cortes: ${cutRulesSummary}`
    : 'Configurar cortes';

  return (
    <Container>
      <ButtonIconMenu
        icon={icons.operationModes.setting}
        isDisabled={isCutRulesConfigDisabled}
        onClick={onConfigureCutRules}
        tooltipDescription={tooltipDescription}
        tooltipPlacement="bottom-end"
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
