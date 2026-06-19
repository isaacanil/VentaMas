import styled from 'styled-components';
import { QRCode } from 'antd';

import type {
  InvoiceBusinessInfo,
  InvoiceData,
  InvoiceSignatureAssets,
} from '@/types/invoice';

import {
  type InvoicePrintPageSummary,
  resolveCreditNoteLines,
  resolveElectronicPrintInfo,
  resolveInvoiceNotes,
  resolveInvoiceTotals,
  resolvePaymentLines,
} from '../../utils';

interface FooterProps {
  business?: InvoiceBusinessInfo | null;
  data?: InvoiceData | null;
  isLastPage?: boolean;
  pageNumber?: number;
  pageSummary?: InvoicePrintPageSummary;
  previewSignatureAssets?: InvoiceSignatureAssets;
  totalPages?: number;
}

const SIGNATURE_CANVAS_WIDTH = 158;
const SIGNATURE_CANVAS_HEIGHT = 82;
const DEFAULT_SIGNATURE_SCALE = 1;
const DEFAULT_STAMP_SCALE = 0.82;
const DEFAULT_STAMP_OPACITY = 0.92;

export default function Footer({
  business,
  data,
  isLastPage = true,
  pageNumber = 1,
  pageSummary,
  previewSignatureAssets,
  totalPages = 1,
}: FooterProps) {
  const paymentLines = resolvePaymentLines(data);
  const creditNoteLines = resolveCreditNoteLines(data);
  const electronicPrintInfo = resolveElectronicPrintInfo(data);
  const totals = resolveInvoiceTotals(data);
  const notes = resolveInvoiceNotes(business, data);
  const signatureAssets =
    previewSignatureAssets ?? business?.invoice?.signatureAssets;
  const signatureUrl =
    typeof signatureAssets?.signatureUrl === 'string'
      ? signatureAssets.signatureUrl
      : '';
  const stampUrl =
    typeof signatureAssets?.stampUrl === 'string'
      ? signatureAssets.stampUrl
      : '';
  const signatureTransform = {
    scale:
      typeof signatureAssets?.signature?.scale === 'number'
        ? signatureAssets.signature.scale
        : DEFAULT_SIGNATURE_SCALE,
    offsetX:
      typeof signatureAssets?.signature?.offsetX === 'number'
        ? signatureAssets.signature.offsetX
        : 0,
    offsetY:
      typeof signatureAssets?.signature?.offsetY === 'number'
        ? signatureAssets.signature.offsetY
        : 0,
  };
  const stampTransform = {
    scale:
      typeof signatureAssets?.stamp?.scale === 'number'
        ? signatureAssets.stamp.scale
        : DEFAULT_STAMP_SCALE,
    offsetX:
      typeof signatureAssets?.stamp?.offsetX === 'number'
        ? signatureAssets.stamp.offsetX
        : 0,
    offsetY:
      typeof signatureAssets?.stamp?.offsetY === 'number'
        ? signatureAssets.stamp.offsetY
        : 0,
    opacity:
      typeof signatureAssets?.stamp?.opacity === 'number'
        ? signatureAssets.stamp.opacity
        : DEFAULT_STAMP_OPACITY,
  };
  const showSignatureCanvas =
    Boolean(signatureAssets?.enabled) && Boolean(signatureUrl || stampUrl);
  const showPageSummary = totalPages > 1 && pageSummary;

  return (
    <FooterRoot>
      <FooterDivider>
        <FooterTopRow>
          <span>{data?.copyType || 'COPIA'}</span>
          {totalPages > 1 ? (
            <span>
              Página {pageNumber} de {totalPages}
            </span>
          ) : null}
        </FooterTopRow>

        {showPageSummary ? (
          <PageSummaryRow>
            <span>Subtotal página: {pageSummary.subtotal}</span>
            <span>ITBIS página: {pageSummary.tax}</span>
            <strong>Total página: {pageSummary.total}</strong>
          </PageSummaryRow>
        ) : null}

        {isLastPage ? (
          <FooterContent>
            <SignatureColumns>
              <LeftColumn>
                <SignatureBlock>
                  {showSignatureCanvas ? (
                    <SignatureCanvas>
                      {signatureUrl ? (
                        <SignatureImage
                          src={signatureUrl}
                          alt="Firma del negocio"
                          $offsetX={signatureTransform.offsetX}
                          $offsetY={signatureTransform.offsetY}
                          $scale={signatureTransform.scale}
                        />
                      ) : null}
                      {stampUrl ? (
                        <StampImage
                          src={stampUrl}
                          alt="Sello del negocio"
                          $offsetX={stampTransform.offsetX}
                          $offsetY={stampTransform.offsetY}
                          $scale={stampTransform.scale}
                          $opacity={stampTransform.opacity}
                        />
                      ) : null}
                      <SignatureCanvasLine />
                    </SignatureCanvas>
                  ) : (
                    <SignatureLine />
                  )}
                  <SignatureLabel>Despachado Por:</SignatureLabel>
                </SignatureBlock>

                {paymentLines.length ? (
                  <SummaryBlock>
                    <SummaryTitle>Metodos de Pago:</SummaryTitle>
                    {paymentLines.map((line) => (
                      <SummaryItem key={`payment-${line}`}>{line}</SummaryItem>
                    ))}
                  </SummaryBlock>
                ) : null}

                {creditNoteLines.length ? (
                  <SummaryBlock>
                    <SummaryTitle>Notas de Credito Aplicadas:</SummaryTitle>
                    {creditNoteLines.map((line) => (
                      <SummaryItem key={`credit-note-${line}`}>
                        {line}
                      </SummaryItem>
                    ))}
                  </SummaryBlock>
                ) : null}
              </LeftColumn>

              <CenterColumn>
                <SignatureBlock>
                  {showSignatureCanvas ? (
                    <SignatureCanvas aria-hidden="true">
                      <SignatureCanvasLine />
                    </SignatureCanvas>
                  ) : (
                    <SignatureLine />
                  )}
                  <SignatureLabel>Recibido Conforme:</SignatureLabel>
                  <CopyTypeLabel>{data?.copyType || 'COPIA'}</CopyTypeLabel>
                </SignatureBlock>
              </CenterColumn>

              <RightColumn>
                {totals.map(([label, value], index) => {
                  const isTotalRow = index === totals.length - 1;

                  return (
                    <TotalRow key={label} $strong={isTotalRow}>
                      <span>{label}:</span>
                      <span>{value}</span>
                    </TotalRow>
                  );
                })}
              </RightColumn>
            </SignatureColumns>

            {electronicPrintInfo ? (
              <ElectronicFiscalBlock $withNotes={Boolean(notes)}>
                <ElectronicQrColumn>
                  {electronicPrintInfo.qrUrl ? (
                    <QrFrame>
                      <QRCode
                        value={electronicPrintInfo.qrUrl}
                        type="svg"
                        size={100}
                        bgColor="#ffffff"
                        color="#111827"
                        bordered={false}
                      />
                    </QrFrame>
                  ) : (
                    <QrPlaceholder>QR</QrPlaceholder>
                  )}
                </ElectronicQrColumn>

                <ElectronicDataColumn>
                  <ElectronicMetaGrid>
                    {electronicPrintInfo.signatureDate ? (
                      <ElectronicMetaItem>
                        <span>Fecha Firma Digital</span>
                        <strong>{electronicPrintInfo.signatureDate}</strong>
                      </ElectronicMetaItem>
                    ) : null}
                    {electronicPrintInfo.securityCode ? (
                      <ElectronicMetaItem>
                        <span>Código de Seguridad</span>
                        <strong>{electronicPrintInfo.securityCode}</strong>
                      </ElectronicMetaItem>
                    ) : null}
                  </ElectronicMetaGrid>
                </ElectronicDataColumn>

                {notes ? <ElectronicNotes>{notes}</ElectronicNotes> : null}
              </ElectronicFiscalBlock>
            ) : notes ? (
              <Notes>{notes}</Notes>
            ) : null}
          </FooterContent>
        ) : null}
      </FooterDivider>
    </FooterRoot>
  );
}

const FooterRoot = styled.div`
  color: var(--invoice-v3-text, #1f2933);
  font-size: var(--invoice-v3-font-body-compact, 10px);
  break-inside: avoid;
  page-break-inside: avoid;
`;

const FooterDivider = styled.div`
  border-top: 1px solid var(--invoice-v3-border, #d6dde5);
  padding-top: 10px;
`;

const FooterTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--invoice-v3-font-caption, 9px);
  color: var(--invoice-v3-muted, #52606d);
`;

const PageSummaryRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 8px;
  font-size: var(--invoice-v3-font-caption-strong, 9.5px);
  color: var(--invoice-v3-text, #1f2933);
  white-space: nowrap;
`;

const ElectronicFiscalBlock = styled.section<{ $withNotes?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $withNotes }) =>
    $withNotes ? '34mm 38mm minmax(0, 1fr)' : '34mm 38mm'};
  gap: 12px;
  align-items: center;
  margin: 4px 0 12px;
  break-inside: avoid;
  page-break-inside: avoid;
`;

const ElectronicQrColumn = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;

const QrFrame = styled.div`
  inline-size: 34mm;
  block-size: 34mm;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 3mm;
  background: #fff;
  overflow: visible;

  .ant-qrcode {
    display: block;
    flex: none;
    overflow: visible;
  }

  canvas,
  svg {
    display: block;
    overflow: visible;
  }
`;

const QrPlaceholder = styled.div`
  inline-size: 34mm;
  block-size: 34mm;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  border: 1px dashed var(--invoice-v3-border, #d6dde5);
  color: var(--invoice-v3-muted, #52606d);
  font-size: var(--invoice-v3-font-caption, 9px);
  font-weight: 700;
`;

const ElectronicDataColumn = styled.div`
  min-width: 0;
  display: grid;
  align-content: center;
`;

const ElectronicMetaGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
`;

const ElectronicMetaItem = styled.p`
  margin: 0;
  min-width: 0;
  display: grid;
  gap: 1px;
  line-height: 1.25;

  span {
    color: var(--invoice-v3-muted, #52606d);
    font-size: var(--invoice-v3-font-caption, 9px);
  }

  strong {
    color: var(--invoice-v3-text, #1f2933);
    font-size: var(--invoice-v3-font-caption-strong, 9.5px);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
`;

const ElectronicNotes = styled.p`
  margin: 0;
  min-width: 0;
  font-size: var(--invoice-v3-font-caption-strong, 9.5px);
  line-height: var(--invoice-v3-line-height, 1.45);
  color: #364152;
  white-space: pre-line;
`;

const FooterContent = styled.div`
  margin-top: 12px;
`;

const SignatureColumns = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
`;

const LeftColumn = styled.div`
  width: 30%;
`;

const CenterColumn = styled.div`
  width: 30%;
`;

const RightColumn = styled.div`
  width: 35%;
`;

const SignatureBlock = styled.div`
  margin-bottom: 10px;
`;

const SignatureLine = styled.div`
  border-bottom: 1px solid var(--invoice-v3-text, #1f2933);
  width: 148px;
  margin-bottom: 6px;
`;

const SignatureCanvas = styled.div`
  position: relative;
  width: ${SIGNATURE_CANVAS_WIDTH}px;
  height: ${SIGNATURE_CANVAS_HEIGHT}px;
  margin-bottom: 6px;
`;

const SignatureCanvasLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-bottom: 1px solid var(--invoice-v3-text, #1f2933);
`;

const SignatureImage = styled.img<{
  $offsetX: number;
  $offsetY: number;
  $scale: number;
}>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 126px;
  height: 50px;
  object-fit: contain;
  z-index: 1;
  transform-origin: center center;
  transform: ${({ $offsetX, $offsetY, $scale }) =>
    `translate(calc(-50% + ${$offsetX}px), calc(-50% + ${$offsetY}px)) scale(${$scale})`};
`;

const StampImage = styled.img<{
  $offsetX: number;
  $offsetY: number;
  $scale: number;
  $opacity: number;
}>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58px;
  height: 58px;
  object-fit: contain;
  z-index: 2;
  transform-origin: center center;
  transform: ${({ $offsetX, $offsetY, $scale }) =>
    `translate(calc(-50% + ${$offsetX}px), calc(-50% + ${$offsetY}px)) scale(${$scale})`};
  opacity: ${({ $opacity }) => $opacity};
`;

const SignatureLabel = styled.p`
  margin: 0 0 10px;
  font-weight: 700;
  font-size: var(--invoice-v3-font-body-compact, 10px);
`;

const CopyTypeLabel = styled.p`
  margin: 0;
  font-size: var(--invoice-v3-font-caption, 9px);
`;

const SummaryBlock = styled.div`
  margin-bottom: 10px;
`;

const SummaryTitle = styled.p`
  margin: 0 0 4px;
  font-size: var(--invoice-v3-font-body-compact, 10px);
  font-weight: 700;
`;

const SummaryItem = styled.p`
  margin: 0 0 3px;
  line-height: var(--invoice-v3-line-height, 1.45);

  &::before {
    content: '• ';
  }
`;

const TotalRow = styled.div<{ $strong?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
  font-size: ${({ $strong }) =>
    $strong
      ? 'calc(var(--invoice-v3-font-body, 10.5px) + 0.5px)'
      : 'var(--invoice-v3-font-body, 10.5px)'};
  font-weight: ${({ $strong }) => ($strong ? 700 : 400)};
`;

const Notes = styled.p`
  margin: 10px 0 0;
  font-size: var(--invoice-v3-font-caption-strong, 9.5px);
  line-height: var(--invoice-v3-line-height, 1.45);
  color: #364152;
  white-space: pre-line;
`;
