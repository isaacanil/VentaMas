import type { ComponentType, ReactElement, SVGProps } from 'react';
import QRCodeImport from 'react-qr-code';

import type {
  PaginatedBlock,
  PaginatedDocumentContext,
} from '@/components/DocumentPagination';
import type {
  InvoicePrintDocumentModel,
  InvoicePrintLineModel,
} from '@/modules/invoice/printPagination';

import * as Styles from '../FiscalDocumentPagination.styles';

export type FiscalDocumentPaginationAdapter = {
  ariaLabel: string;
  blocks: PaginatedBlock[];
  renderFooter: (context: PaginatedDocumentContext) => ReactElement;
  renderHeader: (context: PaginatedDocumentContext) => ReactElement;
};

type QrCodeComponentProps = SVGProps<SVGSVGElement> & {
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  title?: string;
  value: string;
};

const resolveQrCodeComponent = (
  moduleValue: unknown,
): ComponentType<QrCodeComponentProps> => {
  const moduleRecord = moduleValue as {
    default?: unknown;
    QRCode?: unknown;
  };

  return (moduleRecord.QRCode ??
    moduleRecord.default ??
    moduleValue) as ComponentType<QrCodeComponentProps>;
};

const QrCodeComponent = resolveQrCodeComponent(QRCodeImport);

const formatLineMoneyForTable = (
  value: string | null,
  model: InvoicePrintDocumentModel,
): string =>
  model.currency === 'DOP' && value
    ? value.replace(/^(-?)RD\$/, '$1')
    : (value ?? '-');

const renderLineBlock = (
  model: InvoicePrintDocumentModel,
  line: InvoicePrintLineModel,
  index: number,
): ReactElement => (
  <Styles.ProductRow
    $tone={index % 2 === 0 ? 'soft' : 'plain'}
    data-print-block-id={line.id}
    data-print-block-role="product-line"
  >
    <Styles.BodyCell $align="center">{line.quantity}</Styles.BodyCell>
    <Styles.BodyCell>{line.code}</Styles.BodyCell>
    <Styles.DescriptionCell>
      {line.descriptionLines.map((descriptionLine, lineIndex) => (
        <Styles.DescriptionLine
          key={`${line.id}-description-${lineIndex}`}
          $muted={lineIndex > 0}
        >
          {descriptionLine}
        </Styles.DescriptionLine>
      ))}
    </Styles.DescriptionCell>
    <Styles.BodyCell $align="center">{line.billingIndicator}</Styles.BodyCell>
    <Styles.BodyCell $align="right">
      {formatLineMoneyForTable(line.unitPrice, model)}
    </Styles.BodyCell>
    <Styles.BodyCell $align="right">
      {formatLineMoneyForTable(line.discount, model)}
    </Styles.BodyCell>
    <Styles.BodyCell $align="right">
      {formatLineMoneyForTable(line.tax, model)}
    </Styles.BodyCell>
    <Styles.BodyCell $align="right">
      {formatLineMoneyForTable(line.total, model)}
    </Styles.BodyCell>
  </Styles.ProductRow>
);

const renderSummaryBlock = (
  model: InvoicePrintDocumentModel,
  options: { asBodyBlock?: boolean } = {},
): ReactElement => (
  <Styles.SummaryBlock
    data-print-block-id={options.asBodyBlock ? 'document-summary' : undefined}
    data-print-block-role={options.asBodyBlock ? 'summary' : undefined}
    data-print-section="summary"
  >
    <Styles.Totals>
      {model.summaryRows.map((row) => (
        <Styles.TotalRow key={row.label} $strong={row.emphasis}>
          <span>{row.label}</span>
          <span>{row.value}</span>
        </Styles.TotalRow>
      ))}
    </Styles.Totals>
  </Styles.SummaryBlock>
);

const renderSummaryNotesBlock = (
  model: InvoicePrintDocumentModel,
): ReactElement | null =>
  model.notes.length ? (
    <Styles.SummaryNotes data-print-section="notes">
      <Styles.SummaryNotesTitle>Notas</Styles.SummaryNotesTitle>
      <Styles.SummaryNotesText>
        {model.notes.join('\n\n')}
      </Styles.SummaryNotesText>
    </Styles.SummaryNotes>
  ) : null;

const renderPaymentLinesBlock = (
  model: InvoicePrintDocumentModel,
): ReactElement | null =>
  model.paymentLines.length ? (
    <Styles.PaymentLinesBlock data-print-section="payments">
      <Styles.PaymentLinesTitle>Pagos aplicados</Styles.PaymentLinesTitle>
      <Styles.PaymentList>
        {model.paymentLines.map((line, index) => (
          <Styles.PaymentLine key={`payment-line-${index}-${line}`}>
            {line}
          </Styles.PaymentLine>
        ))}
      </Styles.PaymentList>
    </Styles.PaymentLinesBlock>
  ) : null;

const renderElectronicBlock = (
  model: InvoicePrintDocumentModel,
): ReactElement | null =>
  model.electronic ? (
    <Styles.ElectronicBlock data-print-section="ecf">
      <Styles.QrBox>{renderElectronicQr(model.electronic.qrUrl)}</Styles.QrBox>
      <Styles.ElectronicMeta>
        <Styles.ElectronicLine>
          Codigo seguridad:{' '}
          <strong>{model.electronic.securityCode || '-'}</strong>
        </Styles.ElectronicLine>
        {model.electronic.signatureDate ? (
          <Styles.ElectronicLine>
            Fecha Firma Digital:{' '}
            <strong>{model.electronic.signatureDate}</strong>
          </Styles.ElectronicLine>
        ) : null}
      </Styles.ElectronicMeta>
    </Styles.ElectronicBlock>
  ) : null;

const buildBlocks = (model: InvoicePrintDocumentModel): PaginatedBlock[] =>
  model.bodyBlocks.flatMap((block) => {
    if (block.role === 'summary' || block.role === 'notes') {
      return [];
    }

    const lineIndex = model.lines.findIndex((line) => line.id === block.id);
    const line = model.lines[lineIndex];

    return [
      {
        id: block.id,
        content: line ? renderLineBlock(model, line, lineIndex) : null,
      },
    ];
  });

const renderPartyLine = (
  label: string,
  value?: string | number | null,
): ReactElement | null =>
  value ? (
    <Styles.Text>
      {label}: {value}
    </Styles.Text>
  ) : null;

const renderFiscalLines = (lines: string[]): ReactElement[] =>
  lines.map((line) => (
    <Styles.Text key={`fiscal-line-${line}`}>{line}</Styles.Text>
  ));

const renderSignatureCanvas = (
  model: InvoicePrintDocumentModel,
): ReactElement | null => {
  const { signatureAssets } = model;
  const showSignatureCanvas =
    signatureAssets.enabled &&
    Boolean(signatureAssets.signatureUrl || signatureAssets.stampUrl);

  if (!showSignatureCanvas) {
    return null;
  }

  return (
    <Styles.SignatureCanvas>
      {signatureAssets.signatureUrl ? (
        <Styles.SignatureImage
          src={signatureAssets.signatureUrl}
          alt="Firma del negocio"
          $offsetX={signatureAssets.signature.offsetX}
          $offsetY={signatureAssets.signature.offsetY}
          $scale={signatureAssets.signature.scale}
        />
      ) : null}
      {signatureAssets.stampUrl ? (
        <Styles.StampImage
          src={signatureAssets.stampUrl}
          alt="Sello del negocio"
          $offsetX={signatureAssets.stamp.offsetX}
          $offsetY={signatureAssets.stamp.offsetY}
          $opacity={signatureAssets.stamp.opacity}
          $scale={signatureAssets.stamp.scale}
        />
      ) : null}
      <Styles.SignatureCanvasLine />
    </Styles.SignatureCanvas>
  );
};

const renderSignatureLine = (model: InvoicePrintDocumentModel): ReactElement =>
  renderSignatureCanvas(model) ?? <Styles.SignatureLine />;

const renderElectronicQr = (value?: string | null): ReactElement =>
  value ? (
    <QrCodeComponent
      aria-label="QR e-CF"
      bgColor="#ffffff"
      fgColor="#111827"
      level="M"
      role="img"
      size={90}
      title="QR e-CF"
      value={value}
    />
  ) : (
    <Styles.QrPlaceholder>QR e-CF</Styles.QrPlaceholder>
  );

const createHeaderRenderer =
  (model: InvoicePrintDocumentModel) =>
  (context: PaginatedDocumentContext): ReactElement => (
    <Styles.HeaderRoot data-print-section="header">
      <Styles.HeaderTop $hasLogo={Boolean(model.business.logoUrl)}>
        {model.business.logoUrl ? (
          <Styles.BrandColumn>
            <Styles.Logo src={model.business.logoUrl} alt="Logo del negocio" />
          </Styles.BrandColumn>
        ) : null}

        <Styles.BusinessColumn data-print-section="business">
          <Styles.BusinessName>{model.business.name}</Styles.BusinessName>
          {renderPartyLine('Direccion', model.business.address)}
          {renderPartyLine('Tel', model.business.phone)}
          {renderPartyLine('Email', model.business.email)}
          {renderFiscalLines(model.business.fiscalLines)}
          {renderPartyLine('RNC', model.business.fiscalId)}
        </Styles.BusinessColumn>

        <Styles.MetaColumn data-print-section="fiscal">
          <Styles.Title>{model.documentTitle}</Styles.Title>
          <Styles.Text>Fecha: {model.issueDate}</Styles.Text>
          {model.dueDate ? (
            <Styles.Text>Vence: {model.dueDate}</Styles.Text>
          ) : null}
          {model.electronic?.sequenceExpirationDate ? (
            <Styles.Text>
              Fecha venc. e-NCF: {model.electronic.sequenceExpirationDate}
            </Styles.Text>
          ) : null}
          <Styles.StrongText>{model.documentNumberLine}</Styles.StrongText>
          {model.documentValue ? (
            <Styles.Text>
              {model.documentLabel}: {model.documentValue}
            </Styles.Text>
          ) : null}
          <Styles.Text>
            Pagina {context.pageNumber} de {context.totalPages}
          </Styles.Text>
        </Styles.MetaColumn>
      </Styles.HeaderTop>

      <Styles.HeaderDivider data-print-section="header-divider" />

      <Styles.ClientCard data-print-section="client">
        <div>
          <Styles.StrongText>Cliente: {model.client.name}</Styles.StrongText>
          {renderPartyLine('Direccion', model.client.address)}
          {renderPartyLine('Tel', model.client.phone)}
          {renderPartyLine('Tel 2', model.client.secondaryPhone)}
          {renderFiscalLines(model.client.fiscalLines)}
        </div>
        <div>
          {renderPartyLine('RNC/Cedula', model.client.fiscalId)}
          {renderPartyLine('Vendedor', model.sellerName)}
          {renderPartyLine('Fecha pedido', model.preorderDate)}
          {model.affectedDocument ? (
            <Styles.Text>{model.affectedDocument}</Styles.Text>
          ) : null}
        </div>
      </Styles.ClientCard>

      {model.currency === 'DOP' ? (
        <Styles.TableCurrencyNote data-print-section="table-currency-note">
          Montos expresados en RD$
        </Styles.TableCurrencyNote>
      ) : null}

      <Styles.ColumnHeader data-print-section="line-header">
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

const createFooterRenderer =
  (model: InvoicePrintDocumentModel) =>
  ({ pageNumber, totalPages }: PaginatedDocumentContext): ReactElement => (
    <Styles.FooterRoot data-print-section="footer">
      <Styles.FooterTopRow>
        <span>
          {model.copyType ||
            (model.kind === 'invoice' ? 'COPIA' : model.documentTitle)}
        </span>
        <span>
          Pagina {pageNumber} de {totalPages}
        </span>
      </Styles.FooterTopRow>

      <Styles.FooterContent>
        <Styles.FooterColumns>
          <Styles.FooterLeftColumn>
            <Styles.SignatureColumns data-print-section="signatures">
              <Styles.SignatureBlock>
                {renderSignatureLine(model)}
                <Styles.SignatureLabel>Despachado Por:</Styles.SignatureLabel>
              </Styles.SignatureBlock>
              <Styles.SignatureBlock>
                <Styles.SignatureLine $fill />
                <Styles.SignatureLabel>
                  Recibido Conforme:
                </Styles.SignatureLabel>
              </Styles.SignatureBlock>
            </Styles.SignatureColumns>

            {renderPaymentLinesBlock(model)}
            {renderSummaryNotesBlock(model)}
          </Styles.FooterLeftColumn>
          <Styles.FooterRightColumn>
            {renderSummaryBlock(model)}
            {renderElectronicBlock(model)}
          </Styles.FooterRightColumn>
        </Styles.FooterColumns>
      </Styles.FooterContent>
    </Styles.FooterRoot>
  );

export const buildFiscalDocumentPagination = (
  model: InvoicePrintDocumentModel,
): FiscalDocumentPaginationAdapter => ({
  ariaLabel: `${model.documentTitle} ${model.documentNumberLine}`,
  blocks: buildBlocks(model),
  renderFooter: createFooterRenderer(model),
  renderHeader: createHeaderRenderer(model),
});
