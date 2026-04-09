import React from 'react';
import styled from 'styled-components';

interface BodyProps<Row> {
  data?: Row[];
  Item: React.ComponentType<{
    data: Row;
    num: number;
    colWidth?: string[] | number[] | string;
  }>;
  colWidth?: string[] | number[] | string;
  reverse?: boolean;
}

export const Body = <Row,>({
  data,
  Item,
  colWidth,
  reverse,
}: BodyProps<Row>) => {
  if (!Array.isArray(data)) {
    console.error('Data is not an array.');
    return null;
  }

  const itemsArray = data.map((item, index) => (
    <Item key={index} num={index} data={item} colWidth={colWidth} />
  ));

  const finalItems = reverse ? itemsArray.reverse() : itemsArray;

  return <Container>{finalItems}</Container>;
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
`;
