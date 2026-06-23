import type { ReactNode } from 'react';
import styled from 'styled-components';

import type { SupportedDocumentCurrency } from '@/types/products';
import {
  resolveDisplayTaxForCurrency,
  resolveDisplayTotalForCurrency,
  resolveDisplayUnitPriceForCurrency,
} from '@/utils/accounting/lineMonetary';

import {
  buildDescriptionLines,
  formatInvoiceMoney,
  resolveBillingIndicator,
  resolveProductLineDiscount,
  resolveQuantity,
  type PreviewInvoiceProduct,
} from '../../utils';

interface ContentProps {
  products: PreviewInvoiceProduct[];
  documentCurrency: SupportedDocumentCurrency;
  footer?: ReactNode;
}

export default function Content({
  products,
  documentCurrency,
  footer,
}: ContentProps) {
  return (
    <ContentRoot>
      <ProductsTable>
        <thead>
          <tr>
            <HeaderCell className="qty">CANT</HeaderCell>
            <HeaderCell className="code">CODIGO</HeaderCell>
            <HeaderCell className="description">DESCRIPCION</HeaderCell>
            <HeaderCell className="indicator">IND.</HeaderCell>
            <HeaderCell className="money">PRECIO</HeaderCell>
            <HeaderCell className="money discount">DESC.</HeaderCell>
            <HeaderCell className="money">ITBIS</HeaderCell>
            <HeaderCell className="money">TOTAL</HeaderCell>
          </tr>
        </thead>
        {footer ? (
          <ProductsFooter>
            <tr>
              <FooterCell colSpan={8}>{footer}</FooterCell>
            </tr>
          </ProductsFooter>
        ) : null}
        <tbody>
          {products.length ? (
            <>
              {products.map((product) => {
                const quantity = resolveQuantity(product);
                const unitPrice = resolveDisplayUnitPriceForCurrency(
                  product,
                  documentCurrency,
                );
                const taxPerUnit = resolveDisplayTaxForCurrency(
                  { ...(product as Record<string, unknown>), amountToBuy: 1 } as any,
                  documentCurrency,
                );
                const rowTotal = resolveDisplayTotalForCurrency(
                  product,
                  documentCurrency,
                );
                const billingIndicator = resolveBillingIndicator(product);
                const discount = resolveProductLineDiscount(
                  product,
                  documentCurrency,
                );
                const descriptionLines = buildDescriptionLines(
                  product,
                  documentCurrency,
                );

                return (
                  <ProductRow
                    key={String(
                      product?.previewDuplicateKey ||
                        product?.id ||
                        product?.barcode ||
                        product?.cid ||
                        product?.name ||
                        'product',
                    )}
                  >
                    <BodyCell className="qty">{quantity}</BodyCell>
                    <BodyCell className="code">
                      {product?.barcode || product?.sku || '-'}
                    </BodyCell>
                    <DescriptionCell>
                      {descriptionLines.map((line, lineIndex) => (
                        <DescriptionLine
                          key={`${product?.id || product?.barcode || product?.cid || product?.name || 'product'}-line-${lineIndex}-${line}`}
                          $muted={lineIndex > 0}
                        >
                          {line}
                        </DescriptionLine>
                      ))}
                    </DescriptionCell>
                    <BodyCell className="indicator">{billingIndicator}</BodyCell>
                    <BodyCell className="money">
                      {formatInvoiceMoney(unitPrice, documentCurrency)}
                    </BodyCell>
                    <BodyCell className="money discount">
                      {discount ? `-${discount}` : '-'}
                    </BodyCell>
                    <BodyCell className="money">
                      {formatInvoiceMoney(taxPerUnit, documentCurrency)}
                    </BodyCell>
                    <BodyCell className="money">
                      {formatInvoiceMoney(rowTotal, documentCurrency)}
                    </BodyCell>
                  </ProductRow>
                );
              })}
            </>
          ) : (
            <ProductRow>
              <EmptyCell colSpan={8}>
                No hay productos disponibles para renderizar esta factura.
              </EmptyCell>
            </ProductRow>
          )}
        </tbody>
      </ProductsTable>
    </ContentRoot>
  );
}

const ContentRoot = styled.div`
  color: var(--invoice-v3-text, #1f2933);
`;

const ProductsTable = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid var(--invoice-v3-border-soft, #dfe7ef);
  font-size: var(--invoice-v3-font-body-compact, 10px);
  break-inside: auto;

  thead {
    display: table-header-group;
  }

  tbody {
    display: table-row-group;
  }
`;

const HeaderCell = styled.th`
  background: #3c424d;
  color: #fff;
  font-weight: 700;
  text-align: left;
  padding: 8px;
  font-size: var(--invoice-v3-font-caption-strong, 9.5px);
  line-height: 1.3;

  &.qty {
    width: 8%;
    text-align: center;
  }

  &.code {
    width: 13%;
  }

  &.description {
    width: 31%;
  }

  &.indicator {
    width: 7%;
    text-align: center;
  }

  &.money {
    width: 10.25%;
    text-align: right;
  }

  &.discount {
    width: 10%;
  }
`;

const ProductRow = styled.tr`
  break-inside: avoid;

  &:not(:first-child) td {
    border-top: 1px solid #eef2f6;
  }
`;

const BodyCell = styled.td`
  padding: 8px;
  vertical-align: top;
  line-height: var(--invoice-v3-line-height, 1.45);
  overflow-wrap: anywhere;

  &.qty {
    text-align: center;
  }

  &.indicator {
    text-align: center;
    font-weight: 700;
  }

  &.money {
    text-align: right;
    white-space: nowrap;
  }
`;

const DescriptionCell = styled(BodyCell)`
  min-width: 0;
`;

const DescriptionLine = styled.div<{ $muted?: boolean }>`
  color: ${({ $muted }) =>
    $muted ? 'var(--invoice-v3-muted, #52606d)' : 'var(--invoice-v3-text, #1f2933)'};
  font-size: ${({ $muted }) =>
    $muted
      ? 'var(--invoice-v3-font-caption, 9px)'
      : 'var(--invoice-v3-font-body-compact, 10px)'};
`;

const EmptyCell = styled.td`
  padding: 14px 12px;
  color: var(--invoice-v3-muted, #52606d);
  text-align: center;
`;

const ProductsFooter = styled.tfoot`
  display: none;

  @media print {
    display: table-footer-group;
  }
`;

const FooterCell = styled.td`
  padding: 10px 0 0;
  border-top: 0;
`;
