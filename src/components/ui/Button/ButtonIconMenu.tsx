import { Button } from '@heroui/react';
import { Badge, Tooltip } from 'antd';
import React from 'react';
import styled, { css } from 'styled-components';
import type { ButtonIconMenuProps } from '@/types/ui';

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
  const placementMap = {
    'bottom-end': 'bottomRight',
    'bottom-start': 'bottomLeft',
    'top-end': 'topRight',
    'top-start': 'topLeft',
  };
  const antdPlacement = placementMap[tooltipPlacement] || tooltipPlacement;
  const hasBadge = typeof indicatorCount === 'number' && indicatorCount > 0;
  const showDotIndicator = Boolean(indicator) && !hasBadge;
  const handlePress = () => {
    onClick?.({} as never);
  };

  const Btn = (
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
  const ButtonWithBadge = hasBadge ? (
    <Badge
      count={indicatorCount}
      overflowCount={9}
      size="small"
      style={{
        top: 8,
        right: 2,
      }}
      offset={[6, -4]}
    >
      {Btn}
    </Badge>
  ) : (
    Btn
  );

  return label ? (
    <Tooltip title={label} placement={antdPlacement}>
      {ButtonWithBadge}
    </Tooltip>
  ) : (
    ButtonWithBadge
  );
};
type IndicatorProps = {
  $indicator?: boolean;
};

const Container = styled(Button)<IndicatorProps>`
  place-items: center center;
  background-color: rgb(0 0 0 / 20%);
  border-radius: var(--border-radius);
  color: white;
  display: grid;
  height: 2em;
  justify-content: center;
  min-width: 2em;
  padding: 0;
  position: relative;
  width: 2em;

  &[data-hovered='true'],
  &:hover {
    background-color: rgb(0 0 0 / 28%);
    color: white;
  }

  /* Adaptación responsive para móviles */
  @media (width <= 768px) {
    height: 2.3em;
    min-width: 2.3em;
    width: 2.3em;
  }

  ${(props) =>
    props.$indicator &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 20px;
        right: 20px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f6573bff;
        box-shadow: 0 0 0 2px rgb(255 255 255 / 90%);
      }
    `}

  svg {
    font-size: 1.2em;
    width: 1.2em;
    height: 1.2em;

    /* Iconos más grandes en móviles */
    @media (width <= 768px) {
      font-size: 1.4em;
      width: 1.4em;
      height: 1.4em;
    }
  }
`;
