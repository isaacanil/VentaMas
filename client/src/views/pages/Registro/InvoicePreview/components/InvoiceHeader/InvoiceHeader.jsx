import React from 'react';
import styled from 'styled-components';
import InvoiceHeader from './InvoiceHeader';
import ProductList from './ProductList';
import InvoiceSummary from './InvoiceSummary';

const InvoicePreviewWrapper = styled.div`
  margin: 20px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
`;

const InvoicePreview = ({ invoice }) => {
  return (
    <InvoicePreviewWrapper>
      <InvoiceHeader invoice={invoice} />
      <ProductList products={invoice.ver.data.products} />
      <InvoiceSummary invoice={invoice} />
    </InvoicePreviewWrapper>
  );
};

export default InvoicePreview;
