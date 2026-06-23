import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';

export const PrintPaginationGlobalStyle = createGlobalStyle`
  @page {
    size: A4 portrait;
    margin: 0;
  }
`;

export const Page = styled.main`
  min-height: 100vh;
  padding: 24px;
  color: #172033;
  background: #f3f5f8;

  @media print {
    padding: 0;
    background: #fff;
  }
`;

export const Workbench = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  max-width: 1440px;
  margin: 0 auto;

  @media (width <= 1100px) {
    grid-template-columns: 1fr;
  }

  @media print {
    display: block;
    max-width: none;
    margin: 0;
  }
`;

export const ControlPanel = styled.aside`
  position: sticky;
  top: 24px;
  display: grid;
  gap: 18px;
  padding: 18px;
  background: #fff;
  border: 1px solid #d8dee8;
  border-radius: 8px;

  @media print {
    display: none;
  }
`;

export const PanelHeader = styled.header`
  display: grid;
  gap: 6px;
`;

export const Eyebrow = styled.p`
  margin: 0;
  color: #677289;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
`;

export const Title = styled.h1`
  margin: 0;
  color: #101828;
  font-size: 24px;
  line-height: 1.15;
`;

export const Description = styled.p`
  margin: 0;
  color: #536079;
  font-size: 13px;
  line-height: 1.45;
`;

export const ControlGroup = styled.div`
  display: grid;
  gap: 10px;
`;

export const ControlLabel = styled.span`
  color: #344054;
  font-size: 12px;
  font-weight: 700;
`;

export const SegmentedControl = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
`;

export const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
`;

export const SegmentButton = styled.button<{ $active?: boolean }>`
  min-height: 36px;
  padding: 0 10px;
  color: ${({ $active }) => ($active ? '#fff' : '#344054')};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#14532d' : '#f8fafc')};
  border: 1px solid ${({ $active }) => ($active ? '#14532d' : '#cfd6e3')};
  border-radius: 8px;

  &:focus-visible {
    outline: 3px solid rgb(20 83 45 / 24%);
    outline-offset: 2px;
  }
`;

export const PresetButton = styled(SegmentButton)`
  font-size: 11px;
`;

export const Stepper = styled.div`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  gap: 8px;
  align-items: center;
`;

export const IconButton = styled.button`
  display: inline-grid;
  place-items: center;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  color: #172033;
  cursor: pointer;
  background: #fff;
  border: 1px solid #cfd6e3;
  border-radius: 8px;

  &:hover {
    background: #f8fafc;
  }

  &:focus-visible {
    outline: 3px solid rgb(22 119 255 / 22%);
    outline-offset: 2px;
  }
`;

export const StepperValue = styled.div`
  display: grid;
  min-height: 36px;
  place-items: center;
  color: #101828;
  font-size: 14px;
  font-weight: 800;
  background: #f8fafc;
  border: 1px solid #d8dee8;
  border-radius: 8px;
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
`;

export const ToggleInput = styled.input`
  inline-size: 18px;
  block-size: 18px;
  accent-color: #14532d;
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: #0f172a;
  border: 1px solid #0f172a;
  border-radius: 8px;

  &:disabled {
    color: #8a94a6;
    cursor: not-allowed;
    background: #eef2f7;
    border-color: #d8dee8;
  }

  &:focus-visible {
    outline: 3px solid rgb(15 23 42 / 24%);
    outline-offset: 2px;
  }
`;

export const SecondaryActionButton = styled(ActionButton)`
  color: #172033;
  background: #fff;
  border-color: #cfd6e3;
`;

export const MetricsGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
`;

export const Metric = styled.div`
  display: grid;
  gap: 3px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #d8dee8;
  border-radius: 8px;

  dt,
  dd {
    margin: 0;
  }

  dt {
    color: #677289;
    font-size: 11px;
    font-weight: 700;
  }

  dd {
    color: #101828;
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    overflow-wrap: anywhere;
  }
`;

export const PreviewShell = styled.section`
  min-width: 0;

  @media print {
    margin: 0;
  }
`;

export const DocumentHeader = styled.div<{ $expanded?: boolean }>`
  display: grid;
  gap: ${({ $expanded }) => ($expanded ? '12px' : '8px')};
  padding-bottom: 12px;
  border-bottom: 1px solid #cfd6e3;
`;

export const HeaderTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: start;
`;

export const Brand = styled.div`
  display: grid;
  gap: 4px;
`;

export const BrandName = styled.strong`
  color: #101828;
  font-size: 20px;
  line-height: 1.1;
`;

export const BrandMeta = styled.span`
  color: #536079;
  font-size: 11px;
  line-height: 1.35;
`;

export const DocumentMeta = styled.div`
  display: grid;
  gap: 4px;
  min-width: 150px;
  text-align: right;
`;

export const DocumentTitle = styled.strong`
  color: #101828;
  font-size: 15px;
`;

export const DocumentNumber = styled.span`
  color: #344054;
  font-size: 11px;
  font-weight: 700;
`;

export const PageRolePill = styled.span`
  justify-self: end;
  width: max-content;
  max-width: 100%;
  padding: 3px 7px;
  color: #1f3d2c;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  background: #eef6f1;
  border: 1px solid #cfe7d8;
  border-radius: 999px;
  overflow-wrap: anywhere;
`;

export const ClientBand = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 9px 10px;
  background: #eef6f1;
  border: 1px solid #cfe7d8;
  border-radius: 6px;
`;

export const ContinuationBand = styled(ClientBand)`
  background: #f8fafc;
  border-color: #d8dee8;
`;

export const ClientText = styled.span`
  color: #1f3d2c;
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const ColumnHeader = styled.div`
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 78px 82px 92px;
  gap: 8px;
  padding: 7px 10px;
  color: #344054;
  font-size: 9.5px;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
  background: #f1f5f9;
  border: 1px solid #d8dee8;
  border-radius: 6px;

  span:nth-child(1),
  span:nth-child(3) {
    text-align: center;
  }

  span:nth-child(4),
  span:nth-child(5) {
    text-align: right;
  }
`;

export const BodyRow = styled.div<{ $tone?: 'soft' | 'plain' }>`
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 78px 82px 92px;
  gap: 8px;
  align-items: start;
  min-height: 38px;
  padding: 8px 10px;
  background: ${({ $tone }) => ($tone === 'soft' ? '#f8fafc' : '#fff')};
  border: 1px solid #d8dee8;
  border-radius: 6px;
`;

export const SummaryBlock = styled.section<{ $expanded?: boolean }>`
  display: grid;
  gap: ${({ $expanded }) => ($expanded ? '16px' : '12px')};
  min-height: ${({ $expanded }) => ($expanded ? '150px' : 'auto')};
  padding: ${({ $expanded }) => ($expanded ? '18px' : '12px')};
  background: #fff;
  border: 1px solid #b7c9df;
  border-radius: 6px;
  break-inside: avoid;
`;

export const GiantBlock = styled.section`
  display: grid;
  align-content: start;
  gap: 18px;
  min-height: 900px;
  padding: 18px;
  background: #fff7ed;
  border: 2px solid #f97316;
  border-radius: 6px;
  break-inside: avoid;
`;

export const SummaryTitle = styled.h2`
  margin: 0;
  color: #101828;
  font-size: 13px;
  line-height: 1.2;
`;

export const RowCell = styled.span<{ $align?: 'right' | 'center' }>`
  min-width: 0;
  color: #344054;
  font-size: 10.5px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  text-align: ${({ $align }) => $align ?? 'left'};
`;

export const RowStrong = styled(RowCell)`
  color: #101828;
  font-weight: 800;
`;

export const Footer = styled.div<{ $expanded?: boolean }>`
  display: grid;
  gap: ${({ $expanded }) => ($expanded ? '12px' : '8px')};
  padding-top: 10px;
  border-top: 1px solid #cfd6e3;
`;

export const FooterTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #536079;
  font-size: 10px;
  font-weight: 700;
`;

export const FooterContinuation = styled.div`
  padding: 7px 9px;
  color: #536079;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.35;
  background: #f8fafc;
  border: 1px solid #d8dee8;
  border-radius: 6px;
`;

export const TotalsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px;
  gap: 16px;
`;

export const Notes = styled.p`
  margin: 0;
  color: #536079;
  font-size: 10.5px;
  line-height: 1.4;
`;

export const Totals = styled.div`
  display: grid;
  gap: 4px;
`;

export const TotalLine = styled.div<{ $strong?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: ${({ $strong }) => ($strong ? '#101828' : '#344054')};
  font-size: ${({ $strong }) => ($strong ? '12px' : '10.5px')};
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
`;

export const SignatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
`;

export const SignatureLine = styled.div`
  display: grid;
  gap: 6px;
  color: #344054;
  font-size: 10px;
  font-weight: 700;

  &::before {
    content: '';
    display: block;
    border-top: 1px solid #172033;
  }
`;
