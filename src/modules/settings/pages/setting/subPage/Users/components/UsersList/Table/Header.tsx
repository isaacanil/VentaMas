import React from 'react';
import styled from 'styled-components';

interface HeaderItem {
  align?: 'left' | 'right' | 'center';
  name: string;
}

interface HeaderProps {
  data: HeaderItem[];
}

export const Header = ({ data }: HeaderProps) => {
  return data.map(({ align, name }, index) => (
    <ITEMS text={align} key={index}>
      {name}
    </ITEMS>
  ));
};

const ITEMS = styled.div<{ text?: 'left' | 'right' | 'center' }>`
  h3 {
    font-size: 0.8em;
    font-weight: 500;
    text-transform: uppercase;
  }

  width: 100%;
  height: 2em;
  display: grid;
  text-align: center;
  align-items: center;
  ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `;
      case 'left':
        return `
          text-align: left;
          `;
      default:
        break;
    }
  }}
`;
