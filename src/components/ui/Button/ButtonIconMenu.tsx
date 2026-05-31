import { Badge, Tooltip, type TooltipProps } from 'antd';

import type { ButtonIconMenuProps } from '@/types/ui';

import { Container, INDICATOR_BADGE_STYLE } from './ButtonIconMenu.styles';

const tooltipPlacementMap = {
  'bottom-end': 'bottomRight',
  'bottom-start': 'bottomLeft',
  'top-end': 'topRight',
  'top-start': 'topLeft',
} as const;

export const ButtonIconMenu = ({
  icon,
  onClick,
  tooltip,
  tooltipDescription,
  tooltipPlacement = 'top',
  indicator = false,
  indicatorCount,
  ...rest
}: ButtonIconMenuProps) => {
  const label = tooltip || tooltipDescription;
  const antdPlacement: TooltipProps['placement'] =
    tooltipPlacement in tooltipPlacementMap
      ? tooltipPlacementMap[tooltipPlacement as keyof typeof tooltipPlacementMap]
      : (tooltipPlacement as TooltipProps['placement']);
  const hasBadge = typeof indicatorCount === 'number' && indicatorCount > 0;
  const showDotIndicator = Boolean(indicator) && !hasBadge;
  const handlePress = () => {
    onClick?.({} as never);
  };

  const button = (
    <Container
      isIconOnly
      size="sm"
      variant="ghost"
      onPress={handlePress}
      aria-label={label}
      $indicator={showDotIndicator}
      {...rest}
    >
      {icon}
    </Container>
  );
  const buttonWithBadge = hasBadge ? (
    <Badge
      count={indicatorCount}
      overflowCount={9}
      size="small"
      style={INDICATOR_BADGE_STYLE}
      offset={[6, -4]}
    >
      {button}
    </Badge>
  ) : (
    button
  );

  return label ? (
    <Tooltip title={label} placement={antdPlacement}>
      {buttonWithBadge}
    </Tooltip>
  ) : (
    buttonWithBadge
  );
};
