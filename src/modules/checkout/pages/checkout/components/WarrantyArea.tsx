import React from 'react';
import styled from 'styled-components';
import type { InvoiceData } from '@/types/invoice';
import { SubTitle } from '@/modules/checkout/pages/checkout/Receipt';

type WarrantyAreaProps = {
  data?: InvoiceData | null;
};

export const WarrantyArea = ({ data }: WarrantyAreaProps) => {
  const someProductHaveWarranty = data?.products?.some(
    (product) => product?.warranty?.status,
  );
  if (someProductHaveWarranty) {
    return (
      <Container>
        <SubTitle>Garantía</SubTitle>
      </Container>
    );
  }
  return null;
};

const Container = styled.div`
  padding: 1em 0;
`;
