import styled from 'styled-components';

export const Root = styled.div`
  position: relative;
`;

export const Pages = styled.div`
  display: grid;
  justify-items: center;
  gap: 24px;

  @media print {
    gap: 0;
  }
`;

export const DebugPanel = styled.aside`
  display: grid;
  gap: 6px;
  width: min(100%, var(--paginated-page-width));
  margin: 0 auto 16px;
  padding: 10px 12px;
  color: #344054;
  background: #fff;
  border: 1px solid #d8dee8;
  border-radius: 8px;

  @media print {
    display: none;
  }
`;

export const DebugTitle = styled.strong`
  color: #101828;
  font-size: 12px;
  line-height: 1.25;
`;

export const DebugText = styled.span<{ $danger?: boolean }>`
  color: ${({ $danger }) => ($danger ? '#b42318' : '#536079')};
  font-size: 11px;
  line-height: 1.4;
`;

export const Page = styled.article`
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--paginated-chrome-gap);
  inline-size: var(--paginated-page-width);
  block-size: var(--paginated-page-height);
  padding: var(--paginated-padding-block) var(--paginated-padding-inline);
  overflow: hidden;
  color: #172033;
  background: #fff;
  border: 1px solid #d8dee8;
  box-shadow: 0 18px 50px rgb(22 32 51 / 14%);
  break-after: page;
  page-break-after: always;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;

  &:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  @media print {
    border: 0;
    box-shadow: none;
  }
`;

export const PageHeader = styled.header`
  min-width: 0;
`;

export const PageBody = styled.main`
  display: grid;
  align-content: start;
  gap: var(--paginated-body-gap);
  min-height: 0;
  overflow: hidden;
`;

export const PageFooter = styled.footer`
  min-width: 0;
`;

export const PageBlock = styled.div`
  min-width: 0;
  break-inside: avoid;
`;

export const MeasurementLayer = styled.div`
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: -10000px;
  inline-size: var(--paginated-page-width);
  visibility: hidden;
  pointer-events: none;
  contain: layout style;
`;

export const MeasurementPaper = styled.div`
  box-sizing: border-box;
  inline-size: var(--paginated-page-width);
  padding: var(--paginated-padding-block) var(--paginated-padding-inline);
  background: #fff;
`;

export const MeasurementChrome = styled.div`
  min-width: 0;

  &:not(:first-child) {
    margin-top: var(--paginated-chrome-gap);
  }
`;

export const MeasurementBody = styled.div`
  display: grid;
  gap: var(--paginated-body-gap);
  margin-block: var(--paginated-chrome-gap);
`;
