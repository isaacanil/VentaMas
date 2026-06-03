import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
} from 'react';
import styled from 'styled-components';
import type { TooltipProps } from '@/types/ui';

export const Tooltip = ({
  description = null,
  Children,
  placement,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const shouldRenderTooltip = isVisible && description;
  const child =
    isValidElement(Children) && description
      ? cloneElement(Children as ReactElement<Record<string, unknown>>, {
          'aria-describedby': shouldRenderTooltip ? tooltipId : undefined,
        })
      : Children;

  return (
    <Container
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocusCapture={() => setIsVisible(true)}
      onBlurCapture={() => setIsVisible(false)}
    >
      {child}
      {shouldRenderTooltip && (
        <Message id={tooltipId} role="tooltip" placement={placement}>
          {description}
        </Message>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: min-content;
`;

type MessageProps = {
  placement?: TooltipProps['placement'];
};

const Message = styled.div<MessageProps>`
  position: absolute;
  z-index: 1200;
  width: auto;
  padding: 0 8px;
  font-size: 12px;
  color: white;
  white-space: nowrap;
  background-color: rgb(0 0 0 / 87%);
  border-radius: var(--border-radius-light);
  transform: scale(1);

  ${(props) => {
    switch (props.placement) {
      case 'top-start':
        return `
          top: 100%;
          left: 0;
        `;
      case 'top':
        return `
          left: 50%;
          top: -100%;
          transform: translateX(-50%);
        `;

      case 'top-end':
        return `
          top: 100%;
          right: 0;
        `;
      case 'left':
        return `
          left: -100%;
          top: 50%;
          transform: translateY(-50%);
        `;
      case 'left-end':
        return `
          left: -100%;
          top: 0;
        `;
      case 'right':
        return `
          right: -100%;
          top: 50%;
          transform: translateY(-50%);
        `;
      case 'bottom-start':
        return `
          bottom: -100%;
          left: 0;
        `;
      case 'bottom':
        return `
          left: 50%;
          bottom: -100%;
          transform: translateX(-50%);
        `;
      case 'bottom-end':
        return `
          bottom: -100%;
          right: 0;
        `;
      default:
        return '';
    }
  }}
`;
