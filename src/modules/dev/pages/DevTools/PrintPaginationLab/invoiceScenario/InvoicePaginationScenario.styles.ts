import styled from 'styled-components';

export const InvoiceChrome = styled.div`
  --invoice-v3-text: #1f2933;
  --invoice-v3-muted: #52606d;
  --invoice-v3-border: #d6dde5;
  --invoice-v3-border-soft: #dfe7ef;
  --invoice-v3-surface: #fff;
  --invoice-v3-font-title: 16px;
  --invoice-v3-font-heading: 13px;
  --invoice-v3-font-body: 10.5px;
  --invoice-v3-font-body-compact: 10px;
  --invoice-v3-font-caption: 9px;
  --invoice-v3-font-caption-strong: 9.5px;
  --invoice-v3-line-height: 1.45;

  color: var(--invoice-v3-text);
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
  font-size: var(--invoice-v3-font-body);
  line-height: var(--invoice-v3-line-height);
`;

export const HeaderRoot = styled(InvoiceChrome)`
  display: grid;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--invoice-v3-border);
`;

export const HeaderTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 16px;
  align-items: start;
`;

export const BusinessColumn = styled.div`
  min-width: 0;
`;

export const BusinessName = styled.h2`
  margin: 0 0 4px;
  font-size: var(--invoice-v3-font-heading);
  font-weight: 700;
  line-height: 1.25;
`;

export const HeaderText = styled.p`
  margin: 0 0 2px;
  color: var(--invoice-v3-muted);
  font-size: var(--invoice-v3-font-body);
  line-height: var(--invoice-v3-line-height);
`;

export const HeaderStrong = styled(HeaderText)`
  color: var(--invoice-v3-text);
  font-weight: 700;
`;

export const MetaColumn = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  text-align: right;
`;

export const Title = styled.h1`
  margin: 0 0 4px;
  font-size: var(--invoice-v3-font-title);
  font-weight: 700;
  line-height: 1.2;
`;

export const ClientCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid var(--invoice-v3-border-soft);
  border-radius: 4px;
`;

export const ContinuationCard = styled(ClientCard)`
  grid-template-columns: minmax(0, 1fr) auto;
  background: #f8fafc;
`;

export const ColumnHeader = styled.div`
  display: grid;
  grid-template-columns: 7% 13% minmax(0, 1fr) 7% 10% 10% 10% 11%;
  gap: 0;
  color: #fff;
  background: #3c424d;
  border-radius: 4px;
  overflow: hidden;
`;

export const HeaderCell = styled.span<{ $align?: 'right' | 'center' }>`
  padding: 7px 6px;
  font-size: var(--invoice-v3-font-caption-strong);
  font-weight: 700;
  line-height: 1.25;
  text-align: ${({ $align }) => $align ?? 'left'};
`;

export const ProductRow = styled.div<{ $tone?: 'plain' | 'soft' }>`
  display: grid;
  grid-template-columns: 7% 13% minmax(0, 1fr) 7% 10% 10% 10% 11%;
  min-height: 35px;
  background: ${({ $tone }) => ($tone === 'soft' ? '#f8fafc' : '#fff')};
  border: 1px solid var(--invoice-v3-border-soft);
  border-radius: 4px;
  overflow: hidden;
`;

export const BodyCell = styled.span<{ $align?: 'right' | 'center' }>`
  min-width: 0;
  padding: 7px 6px;
  color: var(--invoice-v3-text);
  font-size: var(--invoice-v3-font-body-compact);
  line-height: var(--invoice-v3-line-height);
  text-align: ${({ $align }) => $align ?? 'left'};
  overflow-wrap: anywhere;
`;

export const DescriptionCell = styled(BodyCell)`
  display: grid;
  gap: 2px;
`;

export const DescriptionLine = styled.span<{ $muted?: boolean }>`
  color: ${({ $muted }) =>
    $muted ? 'var(--invoice-v3-muted)' : 'var(--invoice-v3-text)'};
  font-size: ${({ $muted }) =>
    $muted
      ? 'var(--invoice-v3-font-caption)'
      : 'var(--invoice-v3-font-body-compact)'};
`;

export const SummaryBlock = styled.section<{ $large?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  gap: ${({ $large }) => ($large ? '18px' : '14px')};
  min-height: ${({ $large }) => ($large ? '142px' : 'auto')};
  padding: ${({ $large }) => ($large ? '16px' : '12px')};
  color: var(--invoice-v3-text, #1f2933);
  background: #fff;
  border: 1px solid #b7c9df;
  border-radius: 4px;
`;

export const SummaryTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.2;
`;

export const Notes = styled.p`
  margin: 0;
  color: var(--invoice-v3-muted, #52606d);
  font-size: 10px;
  line-height: 1.45;
  white-space: pre-line;
`;

export const Totals = styled.div`
  display: grid;
  gap: 5px;
  align-content: start;
`;

export const TotalRow = styled.div<{ $strong?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: ${({ $strong }) => ($strong ? '12px' : '10px')};
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
`;

export const FooterRoot = styled(InvoiceChrome)`
  display: grid;
  gap: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--invoice-v3-border);
`;

export const FooterTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--invoice-v3-muted);
  font-size: var(--invoice-v3-font-caption);
  font-weight: 700;
`;

export const FooterContinuation = styled.div`
  padding: 7px 9px;
  color: var(--invoice-v3-muted);
  font-size: var(--invoice-v3-font-caption-strong);
  font-weight: 700;
  line-height: 1.35;
  background: #f8fafc;
  border: 1px solid var(--invoice-v3-border-soft);
  border-radius: 4px;
`;

export const FooterContent = styled.div`
  display: grid;
  gap: 10px;
`;

export const SignatureColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 190px;
  gap: 18px;
  align-items: start;
`;

export const SignatureBlock = styled.div`
  display: grid;
  gap: 6px;
  min-height: 42px;
  align-content: end;
  color: var(--invoice-v3-text);
  font-size: var(--invoice-v3-font-body-compact);
  font-weight: 700;

  &::before {
    content: '';
    display: block;
    border-top: 1px solid var(--invoice-v3-text);
  }
`;

export const ElectronicBlock = styled.section`
  display: grid;
  grid-template-columns: 34mm minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding-top: 6px;
  border-top: 1px solid var(--invoice-v3-border-soft);
`;

export const QrBox = styled.div`
  inline-size: 34mm;
  block-size: 34mm;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 3mm;
  color: #111827;
  background: #fff;
  border: 1px solid var(--invoice-v3-border-soft);
  font-size: 8px;
  font-weight: 800;
  text-align: center;
  overflow-wrap: anywhere;
`;

export const ElectronicMeta = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

export const ElectronicLine = styled.p`
  margin: 0;
  color: var(--invoice-v3-muted);
  font-size: var(--invoice-v3-font-caption-strong);
  line-height: 1.35;

  strong {
    color: var(--invoice-v3-text);
  }
`;

export const OverflowBlock = styled.section`
  display: grid;
  align-content: start;
  gap: 14px;
  min-height: 900px;
  padding: 18px;
  color: #7c2d12;
  background: #fff7ed;
  border: 2px solid #f97316;
  border-radius: 6px;
`;
