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

  const Btn = (
    <Container
      onClick={onClick}
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

const Container = styled.button<IndicatorProps>`
  place-items: center center;
  background-color: rgb(0 0 0 / 20%);
  border: none;
  border-radius: var(--border-radius);
  color: white;
  cursor: pointer;
  display: grid;
  height: 2em;
  justify-content: center;
  padding: 0;
  position: relative;
  width: 2em;

  /* Adaptación responsive para móviles */
  @media (width <= 768px) {
    height: 2.3em;
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

    /* Iconos más grandes en móviles */
    @media (width <= 768px) {
      font-size: 1.4em;
    }
  }
`;
