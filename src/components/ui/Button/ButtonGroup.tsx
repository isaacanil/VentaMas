import { forwardRef, type HTMLAttributes } from 'react';
import styled from 'styled-components';
import type { ButtonGroupProps } from './types';

type ButtonGroupCompatProps = ButtonGroupProps & HTMLAttributes<HTMLDivElement>;

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupCompatProps>(
  function ButtonGroup({ children, position, ...containerProps }, ref) {
    return (
      <Container {...containerProps} ref={ref} $position={position}>
        {children}
      </Container>
    );
  }
);

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
