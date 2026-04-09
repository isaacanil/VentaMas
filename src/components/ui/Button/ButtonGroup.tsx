import React from 'react';
import styled from 'styled-components';
import type { ButtonGroupProps } from '@/types/ui';

export const ButtonGroup = ({ children, position }: ButtonGroupProps) => {
  return <Container $position={position}>{children}</Container>;
};

type ContainerProps = {
  $position?: ButtonGroupProps['position'];
};

const Container = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  gap: 0.4em;
  ${(props) => {
    switch (props.$position) {
      case 'right':
        return `
            align-items: end;
          `;

      default:
        break;
    }
  }}
`;
