import React from 'react';
import styled from 'styled-components';

type StatusColor = 'red' | 'yellow' | 'green' | 'gray';

interface StatusIndicatorDotProps {
  color: StatusColor;
}

export const StatusIndicatorDot = ({ color }: StatusIndicatorDotProps) => {
  return <Container colorRef={color}></Container>;
};

const Container = styled.div<{ colorRef: StatusColor }>`
  height: 0.6em;
  width: 1.2em;
  border-radius: 10px;
  ${(props) => {
    switch (props.colorRef) {
      case 'red':
        return `
                    background-color: #e64747;
                `;
      case 'yellow':
        return `
                    background-color: #f7e43c;
                `;
      case 'green':
        return `
                    background-color: #45db59;
                `;
      case 'gray':
        return `
                    background-color: #777777;
                `;

      default:
        break;
    }
  }}
`;
