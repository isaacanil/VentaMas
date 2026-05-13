import React from 'react';
import styled from 'styled-components';

type BodyProps<T> = {
  data: T[];
  Item: React.ComponentType<{
    num: number;
    data: T;
    colWidth?: number | string;
  }>;
  colWidth?: number | string;
};

const bodyItemKeys = new WeakMap<object, string>();
let bodyItemKeyCounter = 0;

const resolveBodyItemKey = (item: unknown): React.Key => {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const explicitKey = record.id ?? record.key ?? record.productId ?? record.name;
    if (explicitKey != null) {
      return String(explicitKey);
    }
    const existingKey = bodyItemKeys.get(item);
    if (existingKey) {
      return existingKey;
    }
    bodyItemKeyCounter += 1;
    const generatedKey = `body-item-${bodyItemKeyCounter}`;
    bodyItemKeys.set(item, generatedKey);
    return generatedKey;
  }

  return `${typeof item}-${String(item)}`;
};

export const Body = <T,>({ data, Item, colWidth }: BodyProps<T>) => {
  if (!Array.isArray(data)) {
    console.error('Data is not an array.');
    return null;
  }

  return (
    <Container>
      {data.map((item, index) => (
        <Item
          key={resolveBodyItemKey(item)}
          num={index}
          data={item}
          colWidth={colWidth}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
`;
