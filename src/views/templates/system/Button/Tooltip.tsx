import { useState } from 'react';
import styled from 'styled-components';
import type { TooltipProps } from '@/types/ui';

export const Tooltip = ({
  description = null,
  Children,
  placement,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Container
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {Children}
      {isVisible && <Message placement={placement}>{description}</Message>}
    </Container>
  );
};
const Container = styled.div`
  position: relative;
  width: min-content;
`;
const Message = styled.div`
  background-color: rgb(0 0 0 / 87%);
  color: white;
  padding: 0 8px;
  border-radius: var(--border-radius-light);
  position: absolute;
  width: auto;
  white-space: nowrap;
  z-index: 20000000000000;
  font-size: 12px;
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
        transform: translateX(-50%);
        top: -100%;
        `;

      case 'top-end':
        return `
          top: 100%;
          right: 0;
      `;
      case 'left-start':
        return `
          
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
          top: 0px;
        
        `;
      case 'right-start':
        return `
          
        `;
      case 'right':
        return `
        right: -100%;
          top: 50%;
          transform: translateY(-50%);
        `;
      case 'right-end':
        return `
          
        `;
      case 'bottom-start':
        return `
        bottom: -100%;
        left: 0;
        `;
      case 'bottom':
        return `
        left: 50%;
        transform: translateX(-50%);
        bottom: -100%;
          
        `;
      case 'bottom-end':
        return `
        bottom: -100%;
        right: 0;
        `;

      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.isVisible) {
      case false:
        return `
          transform: scale(0);
        `;

      default:
        break;
    }
  }}
`;
