import React from 'react';
import styled from 'styled-components';

interface MessageProps {
  title: string;
  bgColor?: 'error' | 'primary';
  fontSize?: 'small' | 'normal' | 'large';
  width?: 'auto';
}

interface ContainerProps {
  bgColor?: 'error' | 'primary';
  fontSize?: 'small' | 'normal' | 'large';
  width?: 'auto';
}


export const Message = ({ title, bgColor, fontSize, width }: MessageProps) => {
  return (
    <Container bgColor={bgColor} fontSize={fontSize} width={width}>
      {title}
    </Container>
  );
};
const Container = styled.div<ContainerProps>`
  height: 1.6em;
  display: flex;
  align-items: center;
  padding: 0 0.4em;
  border-radius: 6px;
  color: black;
  width: min-content;

  ${(props: ContainerProps) => {
    switch (props.width) {
      case 'auto':
        return `
          width: auto;
        `;

      default:
        break;
    }
  }}
  ${(props: ContainerProps) => {
    switch (props.fontSize) {
      case 'small':
        return `
            font-size: 13px;
          `;
      case 'normal':
        return `
            font-size: 16px;
          `;
      case 'large':
        return `
            font-size: 18px;
          `;

      default:
        break;
    }
  }}
    ${(props: ContainerProps) => {
    switch (props.bgColor) {
      case 'error':
        return `
                background-color: rgba(255, 0, 0, 0.100);
                color: var(--gray-10)
                `;
      case 'primary':
        return `
                background-color:  rgba(0, 129, 250, 0.100);
                color: var(--black-4);
                `;
      default:
        break;
    }
  }}
`;
