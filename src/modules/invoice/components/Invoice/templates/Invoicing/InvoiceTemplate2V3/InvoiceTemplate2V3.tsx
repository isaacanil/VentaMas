import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import type {
  InvoiceBusinessInfo,
  InvoiceTemplateProps,
} from '@/types/invoice';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';

import Content from './components/Content';
import Footer from './components/Footer';
import Header from './components/Header';
import { buildPreviewProducts } from './utils';

const Container = styled.div<{ $visible?: boolean }>`
  --invoice-v3-text: #1f2933;
  --invoice-v3-muted: #52606d;
  --invoice-v3-border: #d6dde5;
  --invoice-v3-border-soft: #dfe7ef;
  --invoice-v3-surface: #ffffff;
  --invoice-v3-page-padding-block: 12mm;
  --invoice-v3-page-padding-inline: 13mm;
  --invoice-v3-font-title: 16px;
  --invoice-v3-font-heading: 13px;
  --invoice-v3-font-body: 10.5px;
  --invoice-v3-font-body-compact: 10px;
  --invoice-v3-font-caption: 9px;
  --invoice-v3-font-caption-strong: 9.5px;
  --invoice-v3-line-height: 1.45;
  position: relative;
  width: 100%;
  color: var(--invoice-v3-text);
  background: var(--invoice-v3-surface);
  padding: var(--invoice-v3-page-padding-block)
    var(--invoice-v3-page-padding-inline);
  box-sizing: border-box;
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  font-family:
    Arial,
    'Helvetica Neue',
    Helvetica,
    Arial,
    sans-serif;
  font-size: var(--invoice-v3-font-body);
  line-height: var(--invoice-v3-line-height);

  @media print {
    display: block;
    padding: var(--invoice-v3-page-padding-block)
      var(--invoice-v3-page-padding-inline);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
`;

const PrintLayout = styled.table`
  width: 100%;
  border-collapse: collapse;
  height: 100vh;

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }
`;

const Section = styled.div`
  margin-bottom: 14px;
`;

const HeaderCell = styled.td`
  padding: 0 0 16px;
`;

const FooterCell = styled.td`
  padding: 16px 0 0;
`;

const ContentCell = styled.td`
  vertical-align: top;
`;

const SpacerCell = styled.td`
  height: 100%;
  padding: 0;
  border: 0;
`;

export const InvoiceTemplate2V3 = React.forwardRef<
  HTMLDivElement,
  InvoiceTemplateProps
>(({ data, ignoreHidden, previewSignatureAssets }, ref) => {
  const business = (useSelector(selectBusinessData) ||
    {}) as InvoiceBusinessInfo;
  const sourceProducts = Array.isArray(data?.products) ? data.products : [];
  const previewProducts = buildPreviewProducts(sourceProducts);
  const documentCurrency = resolveInvoiceDocumentCurrency(data);

  return data ? (
    <Container $visible={Boolean(ignoreHidden)} ref={ref}>
      <PrintLayout>
        <thead>
          <tr>
            <HeaderCell>
              <Header business={business} data={data} />
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <ContentCell>
              <Section>
                <Content
                  products={previewProducts}
                  documentCurrency={documentCurrency}
                />
              </Section>
            </ContentCell>
          </tr>
          <tr>
            <SpacerCell />
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <FooterCell>
              <Footer
                business={business}
                data={data}
                previewSignatureAssets={previewSignatureAssets}
              />
            </FooterCell>
          </tr>
        </tfoot>
      </PrintLayout>
    </Container>
  ) : null;
});

InvoiceTemplate2V3.displayName = 'InvoiceTemplate2V3';
