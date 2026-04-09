import React from 'react';
import styled from 'styled-components';
import type { ProductRecord } from '@/types/products';

type ProductCardProps = {
  data: ProductRecord;
  fn: (product: ProductRecord) => void;
  close: () => void;
};

export const ProductCard = ({ data, fn, close }: ProductCardProps) => {
  const handleProductSelected = async () => {
    try {
      fn(data);
      close();
    } catch {
      // Handle error appropriately
    }
  };
  return (
    <Container onClick={handleProductSelected}>
      <span>{data.name}</span>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  height: min-content;
  min-height: 2.4em;
  padding: 0 0.6em;
  background-color: var(--white);
  border-radius: var(--border-radius-light);
`;
