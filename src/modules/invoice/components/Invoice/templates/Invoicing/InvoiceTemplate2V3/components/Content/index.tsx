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
  resolveQuantity,
  type PreviewInvoiceProduct,
} from '../../utils';

interface ContentProps {
  products: PreviewInvoiceProduct[];
  documentCurrency: SupportedDocumentCurrency;
}

export default function Content({ products, documentCurrency }: ContentProps) {
  return (
    <ContentRoot>
      <ProductsTable>
        <thead>
          <tr>
            <HeaderCell className="qty">CANT</HeaderCell>
            <HeaderCell className="code">CODIGO</HeaderCell>
            <HeaderCell className="description">DESCRIPCION</HeaderCell>
            <HeaderCell className="money">PRECIO</HeaderCell>
            <HeaderCell className="money">ITBIS</HeaderCell>
            <HeaderCell className="money">TOTAL</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            <>
              {products.map((product, index) => {
                const quantity = resolveQuantity(product);
                const unitPrice = resolveDisplayUnitPriceForCurrency(
                  product,
                  documentCurrency,
                );
                const taxPerUnit = resolveDisplayTaxForCurrency(
                  {
                    ...product,
                    amountToBuy: 1,
                  },
                  documentCurrency,
                );
                const rowTotal = resolveDisplayTotalForCurrency(
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
                        `${product?.id || product?.barcode || product?.cid || 'product'}-${index}`,
                    )}
                  >
                    <BodyCell className="qty">{quantity}</BodyCell>
                    <BodyCell className="code">
                      {product?.barcode || product?.sku || '-'}
                    </BodyCell>
                    <DescriptionCell>
                      {descriptionLines.map((line, lineIndex) => (
                        <DescriptionLine
                          key={`${product?.id || 'product'}-line-${lineIndex}-${index}`}
                          $muted={lineIndex > 0}
                        >
                          {line}
                        </DescriptionLine>
                      ))}
                    </DescriptionCell>
                    <BodyCell className="money">
                      {formatInvoiceMoney(unitPrice, documentCurrency)}
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
              <EmptyCell colSpan={6}>
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
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--invoice-v3-border-soft, #dfe7ef);
  border-radius: 4px;
  overflow: hidden;
  font-size: var(--invoice-v3-font-body-compact, 10px);

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
  padding: 8px 8px;
  font-size: var(--invoice-v3-font-caption-strong, 9.5px);
  line-height: 1.3;

  &.qty {
    width: 10%;
    text-align: center;
  }

  &.code {
    width: 16%;
  }

  &.description {
    width: 34%;
  }

  &.money {
    width: 13.33%;
    text-align: right;
  }
`;

const ProductRow = styled.tr`
  break-inside: avoid;
  page-break-inside: avoid;

  &:not(:first-child) td {
    border-top: 1px solid #eef2f6;
  }
`;

const BodyCell = styled.td`
  padding: 8px 8px;
  vertical-align: top;
  line-height: var(--invoice-v3-line-height, 1.45);
  word-break: break-word;

  &.qty {
    text-align: center;
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
