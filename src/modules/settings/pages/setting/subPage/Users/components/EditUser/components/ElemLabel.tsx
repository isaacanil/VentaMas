import React from 'react';
import styled from 'styled-components';

const ElemLabel = ({ children, label }) => {
  return (
    <Container>
      <Label>{label}</Label>
      {children}
    </Container>
  );
};

export default ElemLabel;
const Container = styled.div`
  position: relative;
  width: 100%;
`;
const Label = styled.label`
  font-size: 13px;
  color: var(--gray-5);
`;
