import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    align-items: start;
    align-content: start;
    flex-wrap: wrap; /* No permite el wrap inicialmente */
    width: 100%;
    justify-content: ${props => props.align === 'left' ? 'flex-start' : 'flex-end'};
  
`;

const Title = styled.span`
  font-weight: bold;
  margin-right: 10px;
`;

const Value = styled.span`
  color: #555;
`;

const KeyValueDisplay = ({ title, value, align = 'left' }) => {
  return (
    <Container
      align={align}
    >
      <Title>{title}:</Title>
      <Value>{value}</Value>
    </Container>
  );
};

export default KeyValueDisplay;
