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

const rowObjectKeys = new WeakMap<object, string>();
let rowObjectKeyCounter = 0;

const resolveRowKey = (item: unknown): React.Key => {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const explicitKey = record.id ?? record.key ?? record.uid ?? record.email;
    if (explicitKey != null) {
      return String(explicitKey);
    }
    const existingKey = rowObjectKeys.get(item);
    if (existingKey) {
      return existingKey;
    }
    rowObjectKeyCounter += 1;
    const generatedKey = `user-row-${rowObjectKeyCounter}`;
    rowObjectKeys.set(item, generatedKey);
    return generatedKey;
  }

  return `${typeof item}:${String(item)}`;
};

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
    <Item key={resolveRowKey(item)} num={index} data={item} colWidth={colWidth} />
  ));

  const finalItems = reverse ? itemsArray.reverse() : itemsArray;

  return <Container>{finalItems}</Container>;
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
`;
