import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import type {
  InvoiceBusinessInfo,
  InvoiceSignatureAssets,
  InvoiceTemplateProps,
} from '@/types/invoice';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';

import Content from './InvoiceTemplate2V3/components/Content';
import Footer from './InvoiceTemplate2V3/components/Footer';
import Header from './InvoiceTemplate2V3/components/Header';
import {
  buildDescriptionLines,
  buildPreviewProducts,
  type PreviewInvoiceProduct,
} from './InvoiceTemplate2V3/utils';

const MM_TO_PX = 96 / 25.4;
const PAGE_HEIGHT_MM = 297;
const PAGE_PADDING_BLOCK_MM = 12;
const PAGE_PADDING_INLINE_MM = 13;
const PAGE_INNER_HEIGHT_PX =
  (PAGE_HEIGHT_MM - PAGE_PADDING_BLOCK_MM * 2) * MM_TO_PX;
const TABLE_HEADER_HEIGHT_PX = 40;
const PAGE_SECTION_GAP_PX = 14;
const FOOTER_SECTION_GAP_PX = 16;
const ROW_BASE_HEIGHT_PX = 30;
const ROW_EXTRA_LINE_HEIGHT_PX = 14;
const FALLBACK_HEADER_HEIGHT_PX = 170;
const FALLBACK_FOOTER_HEIGHT_PX = 255;

const areHeightsEqual = (next: number[], current: number[]) =>
  next.length === current.length &&
  next.every((value, index) => value === current[index]);

const estimateRowHeight = (
  product: PreviewInvoiceProduct,
  documentCurrency: ReturnType<typeof resolveInvoiceDocumentCurrency>,
) => {
  const descriptionLines = buildDescriptionLines(product, documentCurrency);
  const extraLines = Math.max(0, descriptionLines.length - 1);

  return ROW_BASE_HEIGHT_PX + extraLines * ROW_EXTRA_LINE_HEIGHT_PX;
};

const paginateProductsForPrint = ({
  products,
  documentCurrency,
  headerHeight,
  footerHeight,
}: {
  products: PreviewInvoiceProduct[];
  documentCurrency: ReturnType<typeof resolveInvoiceDocumentCurrency>;
  headerHeight: number;
  footerHeight: number;
}) => {
  if (products.length === 0) {
    return [[]] as PreviewInvoiceProduct[][];
  }

  const contentBudget =
    PAGE_INNER_HEIGHT_PX - headerHeight - PAGE_SECTION_GAP_PX - TABLE_HEADER_HEIGHT_PX;
  const lastPageBudget =
    contentBudget - footerHeight - FOOTER_SECTION_GAP_PX;
  const safeContentBudget = Math.max(contentBudget, ROW_BASE_HEIGHT_PX);
  const safeLastPageBudget = Math.max(lastPageBudget, ROW_BASE_HEIGHT_PX);
  const rowHeights = products.map((product) =>
    estimateRowHeight(product, documentCurrency),
  );
  const suffixSums = new Array(rowHeights.length + 1).fill(0);

  for (let index = rowHeights.length - 1; index >= 0; index -= 1) {
    suffixSums[index] = suffixSums[index + 1] + rowHeights[index];
  }

  const pages: PreviewInvoiceProduct[][] = [];
  let startIndex = 0;

  while (startIndex < products.length) {
    if (suffixSums[startIndex] <= safeLastPageBudget) {
      pages.push(products.slice(startIndex));
      break;
    }

    let endIndex = startIndex;
    let usedHeight = 0;

    while (endIndex < products.length) {
      const nextHeight = rowHeights[endIndex];
      const nextUsedHeight = usedHeight + nextHeight;
      const remainingHeight = suffixSums[endIndex + 1];

      if (nextUsedHeight > safeContentBudget && endIndex > startIndex) {
        break;
      }

      usedHeight = nextUsedHeight;
      endIndex += 1;

      if (remainingHeight <= safeLastPageBudget) {
        break;
      }
    }

    if (endIndex === startIndex) {
      endIndex += 1;
    }

    pages.push(products.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  return pages;
};

const Container = styled.div<{ $visible?: boolean }>`
  --invoice-v3-text: #1f2933;
  --invoice-v3-muted: #52606d;
  --invoice-v3-border: #d6dde5;
  --invoice-v3-border-soft: #dfe7ef;
  --invoice-v3-surface: #ffffff;
  --invoice-v3-page-padding-block: ${PAGE_PADDING_BLOCK_MM}mm;
  --invoice-v3-page-padding-inline: ${PAGE_PADDING_INLINE_MM}mm;
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

const MeasureRoot = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: calc(210mm - (2 * var(--invoice-v3-page-padding-inline)));
  visibility: hidden;
  pointer-events: none;
  z-index: -1;

  @media print {
    display: none;
  }
`;

const PagesStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10mm;

  @media print {
    gap: 0;
  }
`;

const PageShell = styled.section<{ $breakAfter?: boolean }>`
  min-height: calc(297mm - (2 * var(--invoice-v3-page-padding-block)));
  display: block;
  box-sizing: border-box;
  break-inside: avoid-page;
  page-break-inside: avoid;

  @media print {
    min-height: calc(297mm - (2 * var(--invoice-v3-page-padding-block)));
    display: block;
    break-after: ${({ $breakAfter }) => ($breakAfter ? 'page' : 'auto')};
    page-break-after: ${({ $breakAfter }) => ($breakAfter ? 'always' : 'auto')};
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 14px;
`;

const ContentSection = styled.div`
  min-height: 0;
`;

const FooterSection = styled.div`
  padding-top: 16px;
`;

const FooterSpacer = styled.div<{ $height: number }>`
  height: ${({ $height }) => `${$height}px`};
`;

export const InvoiceTemplate2V31 = React.forwardRef<
  HTMLDivElement,
  InvoiceTemplateProps
>(({ data, ignoreHidden, previewSignatureAssets }, ref) => {
  const business = (useSelector(selectBusinessData) ||
    {}) as InvoiceBusinessInfo;
  const headerMeasureRef = useRef<HTMLDivElement>(null);
  const footerMeasureRef = useRef<HTMLDivElement>(null);
  const contentMeasureRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT_PX);
  const [footerHeight, setFooterHeight] = useState(FALLBACK_FOOTER_HEIGHT_PX);
  const [contentHeights, setContentHeights] = useState<number[]>([]);
  const sourceProducts = Array.isArray(data?.products) ? data.products : [];
  const previewProducts = buildPreviewProducts(sourceProducts);
  const documentCurrency = resolveInvoiceDocumentCurrency(data);

  useLayoutEffect(() => {
    const headerNode = headerMeasureRef.current;
    const footerNode = footerMeasureRef.current;

    if (!headerNode || !footerNode) return;
    let frameId: number | null = null;

    const updateHeights = () => {
      setHeaderHeight(Math.ceil(headerNode.getBoundingClientRect().height));
      setFooterHeight(Math.ceil(footerNode.getBoundingClientRect().height));
    };

    const scheduleMeasure = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        updateHeights();
      });
    };

    scheduleMeasure();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
      };
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasure();
    });

    observer.observe(headerNode);
    observer.observe(footerNode);

    return () => {
      observer.disconnect();

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [business, data, previewSignatureAssets]);

  const productPages = useMemo(
    () =>
      paginateProductsForPrint({
        products: previewProducts,
        documentCurrency,
        headerHeight,
        footerHeight,
      }),
    [documentCurrency, footerHeight, headerHeight, previewProducts],
  );

  useLayoutEffect(() => {
    const nodes = contentMeasureRefs.current.slice(0, productPages.length);

    if (!nodes.length || nodes.some((node) => !node)) {
      return;
    }

    let frameId: number | null = null;

    const measureHeights = () => {
      const nextHeights = nodes.map((node) =>
        Math.ceil(node?.getBoundingClientRect().height ?? 0),
      );

      setContentHeights((current) =>
        areHeightsEqual(nextHeights, current) ? current : nextHeights,
      );
    };

    const scheduleMeasure = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        measureHeights();
      });
    };

    scheduleMeasure();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
      };
    }

    const observer = new ResizeObserver(() => {
      scheduleMeasure();
    });

    nodes.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [productPages]);

  return data ? (
    <Container $visible={Boolean(ignoreHidden)} ref={ref}>
      <MeasureRoot aria-hidden="true">
        <div ref={headerMeasureRef}>
          <Header business={business} data={data} />
        </div>
        <div ref={footerMeasureRef}>
          <Footer
            business={business}
            data={data}
            previewSignatureAssets={previewSignatureAssets}
          />
        </div>
      </MeasureRoot>

      <PagesStack>
        {productPages.map((pageProducts, pageIndex) => {
          const isLastPage = pageIndex === productPages.length - 1;
          const lastPageSpacerHeight = isLastPage
            ? Math.max(
                0,
                Math.floor(
                  PAGE_INNER_HEIGHT_PX -
                    headerHeight -
                    PAGE_SECTION_GAP_PX -
                    (contentHeights[pageIndex] ?? 0) -
                    FOOTER_SECTION_GAP_PX -
                    footerHeight,
                ),
              )
            : 0;

          return (
            <PageShell
              key={`invoice-v31-page-${pageIndex}`}
              $breakAfter={!isLastPage}
            >
              <HeaderSection>
                <Header business={business} data={data} />
              </HeaderSection>

              <ContentSection>
                <div
                  ref={(node) => {
                    contentMeasureRefs.current[pageIndex] = node;
                  }}
                >
                  <Content
                    products={pageProducts}
                    documentCurrency={documentCurrency}
                  />
                </div>
              </ContentSection>

              {isLastPage ? (
                <FooterSection>
                  <FooterSpacer $height={lastPageSpacerHeight} />
                  <Footer
                    business={business}
                    data={data}
                    previewSignatureAssets={previewSignatureAssets}
                  />
                </FooterSection>
              ) : null}
            </PageShell>
          );
        })}
      </PagesStack>
    </Container>
  ) : null;
});

InvoiceTemplate2V31.displayName = 'InvoiceTemplate2V31';
