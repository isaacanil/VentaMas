import type { CSSProperties } from 'react';

import styled, { css } from 'styled-components';

import { VmButton } from '@/components/heroui';

type IndicatorProps = {
  $indicator?: boolean;
};

export const INDICATOR_BADGE_STYLE: CSSProperties = {
  top: 8,
  right: 2,
};

export const Container = styled(VmButton)<IndicatorProps>`
  display: grid;
  place-items: center center;
  justify-content: center;
  position: relative;
  width: 2em;
  min-width: 2em;
  height: 2em;
  padding: 0;
  color: white;
  background-color: rgb(0 0 0 / 20%);
  border-radius: var(--border-radius);

  &[data-hovered='true'],
  &:hover {
    color: white;
    background-color: rgb(0 0 0 / 28%);
  }

  @media (width <= 768px) {
    width: 2.3em;
    min-width: 2.3em;
    height: 2.3em;
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
        background: #f6573bff;
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgb(255 255 255 / 90%);
      }
    `}

  svg {
    width: 1.2em;
    height: 1.2em;
    font-size: 1.2em;

    @media (width <= 768px) {
      width: 1.4em;
      height: 1.4em;
      font-size: 1.4em;
    }
  }
`;
