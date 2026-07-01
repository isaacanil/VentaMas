import styled from 'styled-components';

export const Root = styled.section`
  --fiscal-print-text: #1f2933;
  --fiscal-print-muted: #52606d;
  --fiscal-print-border: #d6dde5;
  --fiscal-print-border-soft: #dfe7ef;
  --fiscal-print-surface: #fff;
  --fiscal-print-heading: 13px;
  --fiscal-print-title: 16px;
  --fiscal-print-body: 10.5px;
  --fiscal-print-compact: 10px;
  --fiscal-print-caption: 9px;
  --fiscal-print-caption-strong: 9.5px;
  --fiscal-print-line-height: 1.45;

  color: var(--fiscal-print-text);
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
  font-size: var(--fiscal-print-body);
  line-height: var(--fiscal-print-line-height);
`;

export const Chrome = styled.div`
  color: var(--fiscal-print-text);
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
  font-size: var(--fiscal-print-body);
  line-height: var(--fiscal-print-line-height);
`;

export const HeaderRoot = styled(Chrome)`
  display: grid;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--fiscal-print-border);
`;

export const HeaderTop = styled.div<{ $hasLogo?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $hasLogo }) =>
    $hasLogo ? '108px minmax(0, 1fr) 210px' : 'minmax(0, 1fr) 210px'};
  gap: 16px;
  align-items: start;
`;

export const HeaderDivider = styled.hr`
  inline-size: 100%;
  block-size: 0;
  margin: 0;
  border: 0;
  border-top: 1px solid #c4ccd7;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
`;

export const BrandColumn = styled.div`
  width: 108px;
  padding-right: 8px;
`;

export const Logo = styled.img`
  width: 96px;
  height: 72px;
  object-fit: contain;
  object-position: left center;
`;

export const BusinessColumn = styled.div`
  min-width: 0;
`;

export const MetaColumn = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  text-align: right;
`;

export const BusinessName = styled.h2`
  margin: 0 0 4px;
  font-size: var(--fiscal-print-heading);
  font-weight: 700;
  line-height: 1.25;
`;

export const Title = styled.h1`
  margin: 0 0 4px;
  font-size: var(--fiscal-print-title);
  font-weight: 700;
  line-height: 1.2;
`;

export const Text = styled.p`
  margin: 0 0 2px;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-body);
  line-height: var(--fiscal-print-line-height);
`;

export const StrongText = styled(Text)`
  color: var(--fiscal-print-text);
  font-weight: 700;
`;

export const ClientCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid var(--fiscal-print-border-soft);
  border-radius: 4px;
`;

export const ContinuationCard = styled(ClientCard)`
  grid-template-columns: minmax(0, 1fr) auto;
  background: #f8fafc;
`;

export const TableCurrencyNote = styled.p`
  margin: 0;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-caption-strong);
  font-weight: 700;
  line-height: 1.25;
  text-align: right;
`;

export const ColumnHeader = styled.div`
  display: grid;
  grid-template-columns: 7% 13% minmax(0, 1fr) 10% 10% 10% 11%;
  color: #fff;
  background: #3c424d;
  border-radius: 4px;
  overflow: hidden;
`;

export const HeaderCell = styled.span<{ $align?: 'center' | 'right' }>`
  padding: 7px 6px;
  font-size: var(--fiscal-print-caption-strong);
  font-weight: 700;
  line-height: 1.25;
  text-align: ${({ $align }) => $align ?? 'left'};
`;

export const BlockShell = styled.div`
  min-width: 0;
`;

export const ProductRow = styled(BlockShell)<{ $tone?: 'plain' | 'soft' }>`
  display: grid;
  grid-template-columns: 7% 13% minmax(0, 1fr) 10% 10% 10% 11%;
  min-height: 35px;
  background: ${({ $tone }) => ($tone === 'soft' ? '#f8fafc' : '#fff')};
  border: 1px solid var(--fiscal-print-border-soft);
  border-radius: 4px;
  overflow: hidden;
`;

export const BodyCell = styled.span<{ $align?: 'center' | 'right' }>`
  min-width: 0;
  padding: 7px 6px;
  color: var(--fiscal-print-text);
  font-size: var(--fiscal-print-compact);
  line-height: var(--fiscal-print-line-height);
  text-align: ${({ $align }) => $align ?? 'left'};
  overflow-wrap: anywhere;
`;

export const DescriptionCell = styled(BodyCell)`
  display: grid;
  gap: 2px;
`;

export const DescriptionLine = styled.span<{ $muted?: boolean }>`
  color: ${({ $muted }) =>
    $muted ? 'var(--fiscal-print-muted)' : 'var(--fiscal-print-text)'};
  font-size: ${({ $muted }) =>
    $muted ? 'var(--fiscal-print-caption)' : 'var(--fiscal-print-compact)'};
`;

export const SummaryBlock = styled(BlockShell)`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  align-content: start;
  padding: 9px 10px;
  background: var(--fiscal-print-surface);
  border: 1px solid #b7c9df;
  border-radius: 4px;
`;

export const SummaryTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.2;
`;

export const Notes = styled.p`
  margin: 0;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-compact);
  line-height: var(--fiscal-print-line-height);
  white-space: pre-line;
`;

export const Totals = styled.div`
  display: grid;
  gap: 4px;
  align-content: start;
`;

export const TotalRow = styled.div<{ $strong?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: ${({ $strong }) => ($strong ? '11.5px' : '9.5px')};
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
`;

export const SummaryNotes = styled.div`
  display: grid;
  gap: 3px;
  padding-block: 0;
  padding-inline-start: 0;
  padding-inline-end: 10px;
`;

export const SummaryNotesTitle = styled.p`
  margin: 0;
  color: var(--fiscal-print-text);
  font-size: var(--fiscal-print-caption-strong);
  font-weight: 800;
  line-height: 1.25;
`;

export const SummaryNotesText = styled(Notes)`
  color: var(--fiscal-print-text);
  font-size: var(--fiscal-print-caption);
  line-height: 1.3;
`;

export const PaymentLinesBlock = styled.div`
  display: grid;
  gap: 3px;
  padding-inline-end: 10px;
`;

export const PaymentLinesTitle = styled.p`
  margin: 0;
  color: var(--fiscal-print-text);
  font-size: var(--fiscal-print-caption-strong);
  font-weight: 800;
  line-height: 1.25;
`;

export const PaymentList = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
`;

export const PaymentLine = styled.p`
  margin: 0;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-caption-strong);
  line-height: 1.35;
`;

export const FooterRoot = styled(Chrome)`
  display: grid;
  gap: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--fiscal-print-border);
`;

export const FooterTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-caption);
  font-weight: 700;
`;

export const FooterContent = styled.div`
  display: grid;
  gap: 10px;
`;

export const FooterColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 12px;
  align-items: start;
`;

export const FooterLeftColumn = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

export const FooterRightColumn = styled.div`
  display: grid;
  gap: 6px;
  align-content: start;
  min-width: 0;
`;

export const SignatureColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: end;
  min-width: 0;
`;

export const SignatureBlock = styled.div`
  display: grid;
  gap: 6px;
  min-height: 42px;
  align-content: end;
  justify-items: start;
  color: var(--fiscal-print-text);
  font-size: var(--fiscal-print-compact);
  font-weight: 700;
`;

export const SignatureLine = styled.div<{ $fill?: boolean }>`
  inline-size: ${({ $fill }) => ($fill ? '100%' : '158px')};
  max-inline-size: 100%;
  block-size: 1.5px;
  background: currentColor;
  border-top: 1px solid currentColor;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
`;

export const SignatureCanvas = styled.div`
  position: relative;
  width: 158px;
  height: 82px;
`;

export const SignatureCanvasLine = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  block-size: 1.5px;
  background: currentColor;
  border-top: 1px solid currentColor;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
`;

export const SignatureImage = styled.img<{
  $offsetX: number;
  $offsetY: number;
  $scale: number;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 126px;
  height: 50px;
  object-fit: contain;
  transform: ${({ $offsetX, $offsetY, $scale }) =>
    `translate(calc(-50% + ${$offsetX}px), calc(-50% + ${$offsetY}px)) scale(${$scale})`};
  transform-origin: center center;
`;

export const StampImage = styled.img<{
  $offsetX: number;
  $offsetY: number;
  $opacity: number;
  $scale: number;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 58px;
  height: 58px;
  object-fit: contain;
  opacity: ${({ $opacity }) => $opacity};
  transform: ${({ $offsetX, $offsetY, $scale }) =>
    `translate(calc(-50% + ${$offsetX}px), calc(-50% + ${$offsetY}px)) scale(${$scale})`};
  transform-origin: center center;
`;

export const SignatureLabel = styled.p`
  margin: 0;
  font-size: var(--fiscal-print-compact);
  font-weight: 700;
`;

export const ElectronicBlock = styled.section`
  display: grid;
  grid-template-columns: 23mm minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 5px;
  background: var(--fiscal-print-surface);
  border: 1px solid #b7c9df;
  border-radius: 4px;
`;

export const QrBox = styled.div`
  inline-size: 23mm;
  block-size: 23mm;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 2mm;
  color: #111827;
  background: #fff;
  border: 1px solid var(--fiscal-print-border-soft);
  font-size: 8px;
  font-weight: 800;
  text-align: center;
  overflow-wrap: anywhere;

  svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    shape-rendering: crispEdges;
  }
`;

export const QrPlaceholder = styled.span`
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-caption-strong);
  line-height: 1.2;
`;

export const ElectronicMeta = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

export const ElectronicLine = styled.p`
  margin: 0;
  color: var(--fiscal-print-muted);
  font-size: var(--fiscal-print-caption-strong);
  line-height: 1.35;

  strong {
    color: var(--fiscal-print-text);
  }
`;
