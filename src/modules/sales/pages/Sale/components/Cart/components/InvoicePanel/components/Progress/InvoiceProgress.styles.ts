import { m } from 'framer-motion';
import styled from 'styled-components';

import { VmSpinner } from '@/components/heroui';

export const ProgressContainer = styled.div`
  display: grid;
  height: 100%;
  min-height: 320px;
  padding: var(--ds-space-8, 32px) var(--ds-space-6, 24px);
  place-items: center;
`;

export const ProgressContent = styled(m.div)`
  width: min(100%, 340px);
`;

export const ProgressCurrent = styled(m.p)`
  margin: 0;
  color: var(--ds-color-text-primary, rgb(17 24 39));
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.4;
`;

export const ProgressSteps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4, 16px);
  padding: 0;
  margin: var(--ds-space-5, 20px) 0 0;
  list-style: none;
`;

export const ProgressStep = styled(m.li)<{
  $active: boolean;
  $complete: boolean;
}>`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3, 12px);
  min-width: 0;
  color: ${({ $active, $complete }) => {
    if ($active) return 'rgb(29 78 216)';
    if ($complete) return 'rgb(17 24 39)';
    return 'rgb(100 116 139)';
  }};
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  line-height: 1.35;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export const ProgressDot = styled(m.span)<{
  $active: boolean;
  $complete: boolean;
}>`
  position: relative;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: ${({ $active, $complete }) => ($active && !$complete ? '2px' : '1px')}
    solid
    ${({ $active, $complete }) => {
      if ($complete) return 'rgb(22 163 74)';
      if ($active) return 'rgb(191 219 254)';
      return 'rgb(203 213 225)';
    }};
  border-top-color: ${({ $active, $complete }) =>
    $active && !$complete ? 'rgb(37 99 235)' : undefined};
  border-radius: 999px;
  color: white;
  background: ${({ $complete }) => {
    if ($complete) return 'rgb(22 163 74)';
    return 'transparent';
  }};
  box-shadow: ${({ $active }) =>
    $active
      ? '0 0 0 4px rgb(219 234 254), 0 8px 22px rgb(37 99 235 / 18%)'
      : 'none'};

  &::after {
    position: absolute;
    display: block;
    content: '';
    ${({ $complete }) =>
      $complete
        ? `
          top: 4px;
          left: 7px;
          width: 4px;
          height: 8px;
          border: solid currentColor;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        `
        : `
          top: 6px;
          left: 6px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0;
        `}
    ${({ $active, $complete }) =>
      $active && !$complete
        ? `
          background: rgb(37 99 235);
          opacity: 1;
        `
        : ''}
  }
`;

export const ProgressSpinner = styled(VmSpinner)`
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: rgb(37 99 235);

  :where(svg, [data-slot]) {
    color: inherit;
  }
`;
