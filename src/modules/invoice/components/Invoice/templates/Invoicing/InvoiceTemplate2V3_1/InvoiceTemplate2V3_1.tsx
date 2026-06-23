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
  --invoice-v3-surface: #fff;
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
  background: transparent;
  padding: 0;
  box-sizing: border-box;
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
  font-size: var(--invoice-v3-font-body);
  line-height: var(--invoice-v3-line-height);

  @media print {
    display: block;
    padding: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
`;

const Document = styled.article`
  min-height: 297mm;
  padding: var(--invoice-v3-page-padding-block)
    var(--invoice-v3-page-padding-inline);
  box-sizing: border-box;
  background: var(--invoice-v3-surface);
  display: flex;
  flex-direction: column;

  @media screen {
    margin-bottom: 8mm;
  }
`;

const Section = styled.section`
  margin-bottom: 14px;
`;

const ContentSection = styled.section`
  margin-bottom: 14px;
`;

const SummarySection = styled.section`
  margin-top: auto;
  padding-top: 16px;
  flex: 0 0 auto;
  break-inside: avoid;

  @media print {
    display: none;
  }
`;

export const InvoiceTemplate2V3_1 = React.forwardRef<
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
      <Document>
        <Section>
          <Header business={business} data={data} />
        </Section>
        <ContentSection>
          <Content
            documentCurrency={documentCurrency}
            footer={
              <Footer
                business={business}
                data={data}
                isLastPage
                previewSignatureAssets={previewSignatureAssets}
                showPageChrome={false}
                totalPages={1}
              />
            }
            products={previewProducts}
          />
        </ContentSection>
        <SummarySection>
          <Footer
            business={business}
            data={data}
            isLastPage
            previewSignatureAssets={previewSignatureAssets}
            showPageChrome={false}
            totalPages={1}
          />
        </SummarySection>
      </Document>
    </Container>
  ) : null;
});

InvoiceTemplate2V3_1.displayName = 'InvoiceTemplate2V3_1';
