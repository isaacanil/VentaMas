import { Tooltip as HeroTooltip } from '@heroui/react';
import type { TooltipRootProps } from '@heroui/react';
import styled from 'styled-components';

const VmTooltipRoot = ({
  delay = 180,
  closeDelay = 80,
  ...props
}: TooltipRootProps) => {
  return <HeroTooltip delay={delay} closeDelay={closeDelay} {...props} />;
};

const VmTooltipTrigger = styled(HeroTooltip.Trigger)`
  display: inline-flex;
  width: max-content;
  align-items: center;
`;

const VmTooltipContent = styled(HeroTooltip.Content)`
  z-index: var(--ds-z-tooltip);
  max-width: min(280px, calc(100vw - var(--ds-space-6)));
  padding: var(--ds-space-2) var(--ds-space-3);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  overflow-wrap: anywhere;
  background: var(--ds-color-bg-elevated);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-md);
`;

const VmTooltipArrow = styled(HeroTooltip.Arrow)`
  color: var(--ds-color-bg-elevated);

  svg {
    display: block;
    fill: var(--ds-color-bg-elevated);
    filter: drop-shadow(0 1px 0 var(--ds-color-border-default));
  }

  path {
    stroke: var(--ds-color-border-default);
    stroke-width: 1px;
  }
`;

export const VmTooltip = Object.assign(VmTooltipRoot, {
  Root: VmTooltipRoot,
  Trigger: VmTooltipTrigger,
  Content: VmTooltipContent,
  Arrow: VmTooltipArrow,
});

export type {
  TooltipArrowProps as VmTooltipArrowProps,
  TooltipContentProps as VmTooltipContentProps,
  TooltipRootProps as VmTooltipProps,
  TooltipTriggerProps as VmTooltipTriggerProps,
} from '@heroui/react';
