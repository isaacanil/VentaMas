import { useMemo, type ReactElement } from 'react';

import type {
  PaginatedBlock,
  PaginatedDocumentContext,
} from '@/components/DocumentPagination';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';

import * as Styles from './InvoicePaginationScenario.styles';
import {
  buildInvoiceScenarioBusiness,
  buildInvoiceScenarioData,
  type InvoiceScenarioPresetId,
  type InvoiceScenarioProduct,
} from './invoiceScenarioFixtures';

type InvoicePaginationScenarioOptions = {
  includeOverflowBlock?: boolean;
  presetId: InvoiceScenarioPresetId;
};

type InvoicePaginationScenario = {
  blocks: PaginatedBlock[];
  business: InvoiceBusinessInfo;
  data: InvoiceData;
  renderFooter: (context: PaginatedDocumentContext) => ReactElement;
  renderHeader: (context: PaginatedDocumentContext) => ReactElement;
  totalLabel: string;
};

const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('es-DO', {
    currency: 'DOP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number(value || 0));

const formatDate = (value: unknown) => {
  if (typeof value === 'string') {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  return '-';
};

const toInvoiceScenarioProduct = (
  product: InvoiceData['products'] extends Array<infer Product>
    ? Product
    : never,
) => product as InvoiceScenarioProduct;

const resolveProducts = (data: InvoiceData): InvoiceScenarioProduct[] =>
  (data.products || []).map(toInvoiceScenarioProduct);

const buildDescriptionLines = (product: InvoiceScenarioProduct) =>
  [
    product.name || product.productName || 'Producto sin nombre',
    product.brand && product.brand !== 'Sin marca' ? `Marca: ${product.brand}` : null,
    product.comment ? `Nota: ${product.comment}` : null,
    product.measurement ? `Unidad: ${product.measurement}` : null,
    product.scenarioDiscount > 0
      ? `Descuento aplicado: -${formatMoney(product.scenarioDiscount)}`
      : null,
  ].filter((line): line is string => Boolean(line));

const resolveBillingIndicator = (product: InvoiceScenarioProduct) => {
  if (product.scenarioTaxRate === 18) return '1';
  if (product.scenarioTaxRate === 16) return '2';
  if (product.scenarioTaxRate === 0) return '4';
  return '1';
};

const resolveElectronicPrintInfo = (data: InvoiceData) => {
  const snapshot = data.electronicTaxReceipt ?? data.fiscal?.electronic;
  const qr =
    typeof snapshot?.qr === 'string'
      ? snapshot.qr
      : typeof snapshot?.qr?.url === 'string'
        ? snapshot.qr.url
        : snapshot?.officialVerifyUrl;

  if (!snapshot && !data.eNcf) {
    return null;
  }

  return {
    eNcf: snapshot?.eNcf || data.eNcf || data.NCF || null,
    qrUrl: qr || null,
    securityCode: snapshot?.securityCode || null,
    signatureDate:
      typeof snapshot?.printData?.fechaFirmaDigital === 'string'
        ? snapshot.printData.fechaFirmaDigital
        : formatDate(snapshot?.issuedAt),
    statusLabel:
      snapshot?.status === 'accepted'
        ? 'Aceptado'
        : snapshot?.status
          ? String(snapshot.status)
          : null,
  };
};

const resolveInvoiceComment = (data: InvoiceData): string =>
  typeof data.invoiceComment === 'string'
    ? data.invoiceComment
    : 'Documento de laboratorio.';

const renderInvoiceRow = (
  product: InvoiceScenarioProduct,
  index: number,
): ReactElement => {
  const descriptionLines = buildDescriptionLines(product);

  return (
    <Styles.ProductRow $tone={index % 2 === 0 ? 'soft' : 'plain'}>
      <Styles.BodyCell $align="center">
        {product.scenarioQuantity}
      </Styles.BodyCell>
      <Styles.BodyCell>{product.barcode || product.sku || '-'}</Styles.BodyCell>
      <Styles.DescriptionCell>
        {descriptionLines.map((line, lineIndex) => (
          <Styles.DescriptionLine
            key={`${product.id || product.cid || index}-${lineIndex}`}
            $muted={lineIndex > 0}
          >
            {line}
          </Styles.DescriptionLine>
        ))}
      </Styles.DescriptionCell>
      <Styles.BodyCell $align="center">
        {resolveBillingIndicator(product)}
      </Styles.BodyCell>
      <Styles.BodyCell $align="right">
        {formatMoney(product.scenarioUnitPrice)}
      </Styles.BodyCell>
      <Styles.BodyCell $align="right">
        {product.scenarioDiscount > 0
          ? `-${formatMoney(product.scenarioDiscount)}`
          : '-'}
      </Styles.BodyCell>
      <Styles.BodyCell $align="right">
        {formatMoney(product.scenarioLineTax)}
      </Styles.BodyCell>
      <Styles.BodyCell $align="right">
        {formatMoney(product.scenarioLineTotal)}
      </Styles.BodyCell>
    </Styles.ProductRow>
  );
};

const renderSummaryBlock = ({
  data,
  large,
}: {
  data: InvoiceData;
  large: boolean;
}): ReactElement => (
  <Styles.SummaryBlock $large={large} data-invoice-scenario-summary>
    <div>
      <Styles.SummaryTitle>Resumen final</Styles.SummaryTitle>
      <Styles.Notes>
        {resolveInvoiceComment(data)}
      </Styles.Notes>
    </div>
    <Styles.Totals>
      <Styles.TotalRow>
        <span>Sub-total</span>
        <span>{formatMoney(data.totalPurchaseWithoutTaxes?.value)}</span>
      </Styles.TotalRow>
      <Styles.TotalRow>
        <span>ITBIS</span>
        <span>{formatMoney(data.totalTaxes?.value)}</span>
      </Styles.TotalRow>
      <Styles.TotalRow $strong>
        <span>Total</span>
        <span>{formatMoney(data.totalPurchase?.value)}</span>
      </Styles.TotalRow>
    </Styles.Totals>
  </Styles.SummaryBlock>
);

const renderOverflowBlock = (): ReactElement => (
  <Styles.OverflowBlock>
    <Styles.SummaryTitle>Bloque gigante de factura</Styles.SummaryTitle>
    <Styles.Notes>
      Este bloque intencionalmente excede la capacidad de una pagina. Valida que
      el motor bloquee la impresion antes de ocultar un corte real.
    </Styles.Notes>
  </Styles.OverflowBlock>
);

const buildInvoiceBlocks = ({
  data,
  includeOverflowBlock,
  presetId,
}: {
  data: InvoiceData;
  includeOverflowBlock: boolean;
  presetId: InvoiceScenarioPresetId;
}): PaginatedBlock[] => {
  const products = resolveProducts(data);
  const productBlocks = products.map<PaginatedBlock>((product, index) => ({
    content: renderInvoiceRow(product, index),
    id: `invoice-row-${index + 1}`,
  }));
  const blocks = [...productBlocks];

  if (includeOverflowBlock) {
    blocks.splice(Math.min(4, blocks.length), 0, {
      content: renderOverflowBlock(),
      id: 'invoice-overflow-block',
    });
  }

  blocks.push({
    content: renderSummaryBlock({
      data,
      large: presetId === 'largeSummary',
    }),
    id: 'invoice-summary',
  });

  return blocks;
};

const renderHeader = ({
  business,
  data,
}: {
  business: InvoiceBusinessInfo;
  data: InvoiceData;
}) =>
  function InvoiceScenarioHeader(context: PaginatedDocumentContext) {
    const isContinuation = !context.isFirstPage;

    return (
      <Styles.HeaderRoot data-invoice-scenario-header>
        <Styles.HeaderTop>
          <Styles.BusinessColumn>
            <Styles.BusinessName>{business.name || 'Empresa'}</Styles.BusinessName>
            {business.address ? (
              <Styles.HeaderText>{business.address}</Styles.HeaderText>
            ) : null}
            {business.tel ? (
              <Styles.HeaderText>Tel: {business.tel}</Styles.HeaderText>
            ) : null}
            {business.email ? (
              <Styles.HeaderText>{business.email}</Styles.HeaderText>
            ) : null}
            {business.rnc ? (
              <Styles.HeaderStrong>RNC: {business.rnc}</Styles.HeaderStrong>
            ) : null}
          </Styles.BusinessColumn>

          <Styles.MetaColumn>
            <Styles.Title>
              {data.electronicTaxReceipt ? 'Factura e-CF' : 'Factura'}
            </Styles.Title>
            <Styles.HeaderText>Fecha: {formatDate(data.date)}</Styles.HeaderText>
            <Styles.HeaderStrong>
              {data.NCF ? `NCF: ${data.NCF}` : `Factura: ${data.numberID || '-'}`}
            </Styles.HeaderStrong>
            <Styles.HeaderText>
              Pagina {context.pageNumber} de {context.totalPages}
            </Styles.HeaderText>
          </Styles.MetaColumn>
        </Styles.HeaderTop>

        {isContinuation ? (
          <Styles.ContinuationCard>
            <Styles.HeaderStrong>
              Continuacion de factura {data.numberID || data.NCF || '-'}
            </Styles.HeaderStrong>
            <Styles.HeaderText>Filas distribuidas por alto real</Styles.HeaderText>
          </Styles.ContinuationCard>
        ) : (
          <Styles.ClientCard>
            <div>
              <Styles.HeaderStrong>
                Cliente: {data.client?.name || 'Cliente generico'}
              </Styles.HeaderStrong>
              {data.client?.address ? (
                <Styles.HeaderText>{data.client.address}</Styles.HeaderText>
              ) : null}
              {data.client?.tel ? (
                <Styles.HeaderText>Tel: {data.client.tel}</Styles.HeaderText>
              ) : null}
            </div>
            <div>
              <Styles.HeaderText>RNC/Cedula: {data.client?.rnc || '-'}</Styles.HeaderText>
              <Styles.HeaderText>Vendedor: {data.seller?.name || '-'}</Styles.HeaderText>
            </div>
          </Styles.ClientCard>
        )}

        <Styles.ColumnHeader>
          <Styles.HeaderCell $align="center">Cant</Styles.HeaderCell>
          <Styles.HeaderCell>Codigo</Styles.HeaderCell>
          <Styles.HeaderCell>Descripcion</Styles.HeaderCell>
          <Styles.HeaderCell $align="center">Ind.</Styles.HeaderCell>
          <Styles.HeaderCell $align="right">Precio</Styles.HeaderCell>
          <Styles.HeaderCell $align="right">Desc.</Styles.HeaderCell>
          <Styles.HeaderCell $align="right">ITBIS</Styles.HeaderCell>
          <Styles.HeaderCell $align="right">Total</Styles.HeaderCell>
        </Styles.ColumnHeader>
      </Styles.HeaderRoot>
    );
  };

const renderFooter = ({
  business,
  data,
}: {
  business: InvoiceBusinessInfo;
  data: InvoiceData;
}) =>
  function InvoiceScenarioFooter({
    isLastPage,
    pageNumber,
    totalPages,
  }: PaginatedDocumentContext) {
    const electronicInfo = resolveElectronicPrintInfo(data);

    return (
      <Styles.FooterRoot data-invoice-scenario-footer>
        <Styles.FooterTopRow>
          <span>{data.copyType || 'COPIA'}</span>
          <span>
            Pagina {pageNumber} de {totalPages}
          </span>
        </Styles.FooterTopRow>

        {isLastPage ? (
          <Styles.FooterContent>
            <Styles.SignatureColumns>
              <Styles.SignatureBlock>Despachado Por:</Styles.SignatureBlock>
              <Styles.SignatureBlock>Recibido Conforme:</Styles.SignatureBlock>
              <Styles.Totals>
                <Styles.TotalRow>
                  <span>Sub-total</span>
                  <span>{formatMoney(data.totalPurchaseWithoutTaxes?.value)}</span>
                </Styles.TotalRow>
                <Styles.TotalRow>
                  <span>ITBIS</span>
                  <span>{formatMoney(data.totalTaxes?.value)}</span>
                </Styles.TotalRow>
                <Styles.TotalRow $strong>
                  <span>Total</span>
                  <span>{formatMoney(data.totalPurchase?.value)}</span>
                </Styles.TotalRow>
              </Styles.Totals>
            </Styles.SignatureColumns>

            {electronicInfo ? (
              <Styles.ElectronicBlock>
                <Styles.QrBox>{electronicInfo.qrUrl || 'QR e-CF'}</Styles.QrBox>
                <Styles.ElectronicMeta>
                  <Styles.ElectronicLine>
                    e-NCF: <strong>{electronicInfo.eNcf || '-'}</strong>
                  </Styles.ElectronicLine>
                  <Styles.ElectronicLine>
                    Firma digital:{' '}
                    <strong>{electronicInfo.signatureDate || '-'}</strong>
                  </Styles.ElectronicLine>
                  <Styles.ElectronicLine>
                    Codigo seguridad:{' '}
                    <strong>{electronicInfo.securityCode || '-'}</strong>
                  </Styles.ElectronicLine>
                  {electronicInfo.statusLabel ? (
                    <Styles.ElectronicLine>
                      Estado: <strong>{electronicInfo.statusLabel}</strong>
                    </Styles.ElectronicLine>
                  ) : null}
                </Styles.ElectronicMeta>
              </Styles.ElectronicBlock>
            ) : null}

            {business.invoice?.invoiceMessage ? (
              <Styles.Notes>{business.invoice.invoiceMessage}</Styles.Notes>
            ) : null}
          </Styles.FooterContent>
        ) : (
          <Styles.FooterContinuation>
            Esta factura continua en la pagina siguiente.
          </Styles.FooterContinuation>
        )}
      </Styles.FooterRoot>
    );
  };

export const buildInvoicePaginationScenario = ({
  includeOverflowBlock = false,
  presetId,
}: InvoicePaginationScenarioOptions): InvoicePaginationScenario => {
  const business = buildInvoiceScenarioBusiness();
  const data = buildInvoiceScenarioData(presetId);

  return {
    blocks: buildInvoiceBlocks({
      data,
      includeOverflowBlock,
      presetId,
    }),
    business,
    data,
    renderFooter: renderFooter({ business, data }),
    renderHeader: renderHeader({ business, data }),
    totalLabel: formatMoney(data.totalPurchase?.value),
  };
};

export const useInvoicePaginationScenario = ({
  includeOverflowBlock = false,
  presetId,
}: InvoicePaginationScenarioOptions): InvoicePaginationScenario =>
  useMemo(
    () =>
      buildInvoicePaginationScenario({
        includeOverflowBlock,
        presetId,
      }),
    [includeOverflowBlock, presetId],
  );

export type { InvoicePaginationScenario };
