import { Switch as HeroSwitch } from '@heroui/react';
import type { SwitchProps as HeroSwitchProps } from '@heroui/react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { vmControlFocusRing } from '../styles';

const VmSwitchControl = styled(HeroSwitch.Control)`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  box-sizing: border-box;
  width: 40px;
  height: 22px;
  padding: 2px;
  border: 1px solid var(--ds-color-border-strong);
  border-radius: 999px;
  background: var(--ds-color-bg-muted);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
`;

const VmSwitchThumb = styled(HeroSwitch.Thumb)`
  display: block;
  flex: 0 0 16px;
  width: 16px;
  min-width: 16px;
  height: 16px;
  margin-inline-start: 0;
  border-radius: 999px;
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-xs, 0 1px 2px rgb(15 23 42 / 16%));
  transition: transform 0.18s ease;
`;

const VmSwitchRootBase = ({ children, ...props }: HeroSwitchProps) => {
  const content =
    children && typeof children !== 'function' && typeof children !== 'boolean'
      ? (children as ReactNode)
      : null;

  return (
    <HeroSwitch {...props}>
      <VmSwitchControl>
        <VmSwitchThumb />
      </VmSwitchControl>
      {content ? <HeroSwitch.Content>{content}</HeroSwitch.Content> : null}
    </HeroSwitch>
  );
};

const VmSwitchRoot = styled(VmSwitchRootBase)`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  cursor: pointer;

  &[data-hovered='true'] [data-slot='switch-control'],
  &:hover [data-slot='switch-control'] {
    border-color: var(--ds-color-border-focus);
  }

  &[data-focus-visible='true'] [data-slot='switch-control'] {
    border-color: var(--ds-color-border-focus);
    box-shadow: ${vmControlFocusRing};
  }

  &&[data-selected='true'] [data-slot='switch-control'],
  &&[aria-checked='true'] [data-slot='switch-control'] {
    border-color: var(--ds-color-action-primary);
    background: var(--ds-color-action-primary);
  }

  &&[data-selected='true'] [data-slot='switch-thumb'],
  &&[aria-checked='true'] [data-slot='switch-thumb'] {
    margin-inline-start: 0;
    transform: translateX(18px);
  }

  &[data-disabled='true'] {
    color: var(--ds-color-text-disabled);
    cursor: not-allowed;
  }

  &[data-disabled='true'] [data-slot='switch-control'] {
    border-color: var(--ds-color-interactive-disabled-border);
    background: var(--ds-color-interactive-disabled-bg);
  }
`;

export const VmSwitch = Object.assign(VmSwitchRoot, {
  Root: VmSwitchRoot,
  Control: VmSwitchControl,
  Thumb: VmSwitchThumb,
  Content: HeroSwitch.Content,
  Icon: HeroSwitch.Icon,
});

export type { SwitchProps as VmSwitchProps } from '@heroui/react';
