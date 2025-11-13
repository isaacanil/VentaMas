import React from 'react';
import styled from 'styled-components';

export const Body = ({ data, Item, colWidth }) => {
  if (!Array.isArray(data)) {
    console.error('Data is not an array.');
    return null;
  }

  return (
    <Container>
      {data.map((item, index) => (
        <Item key={index} num={index} data={item} colWidth={colWidth} />
      ))}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
`;
