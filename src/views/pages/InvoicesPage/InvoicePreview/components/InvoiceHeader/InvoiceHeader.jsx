import React from 'react';
import styled from 'styled-components';

import InvoiceHeader from './InvoiceHeader';
import InvoiceSummary from './InvoiceSummary';
import ProductList from './ProductList';

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
