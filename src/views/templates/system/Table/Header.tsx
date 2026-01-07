import React from 'react';
import styled from 'styled-components';

import { Row } from './Row';

export const Header = ({ children, colWidth, scrolled = false }) => {
  return (
    <Container scrolled={scrolled}>
      <Row element="header" col={colWidth}>
        {children}
      </Row>
    </Container>
  );
};
const Container = styled.div`
  position: sticky;
  top: 0;
  height: 2.4em;
  display: flex;
  align-items: center;
  z-index: 1;
  background-color: var(--white);
  color: #5f6368;
  font-family: montserrat, sans-serif;
  padding: 0 1em;
  font-weight: 500;
  border-bottom: var(--border-primary);
  ${(props) =>
    props.scrolled &&
    `
        background-color: var(--white); 
        box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.249);
        `}
`;
