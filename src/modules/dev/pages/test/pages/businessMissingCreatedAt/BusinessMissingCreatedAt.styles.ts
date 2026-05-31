import styled from 'styled-components';

export const Page = styled.div`
  padding: 16px;
`;

export const Description = styled.p`
  margin-top: 4px;
  color: #555;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const FixedDateToggle = styled.label`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  background: #f6f6f6;
  border-radius: 4px;

  input {
    margin: 0;
  }
`;

export const ScanSummary = styled.span`
  align-self: center;
  font-size: 13px;
  color: #555;
`;

export const ProgressWrapper = styled.div`
  margin-top: 12px;
`;

export const ResultsSection = styled.div`
  margin-top: 16px;
`;

export const TableFrame = styled.div`
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 6px;
`;

export const ResultsTable = styled.table`
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
`;

export const HeaderCell = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  text-align: left;
  background: white;
  border-bottom: 1px solid #eee;
`;

export const BodyCell = styled.td`
  padding: 6px 10px;
  font-size: 13px;
  border-bottom: 1px solid #f2f2f2;
`;

export const MissingRow = styled.tr`
  background: #fff8e1;
`;

export const EmptyName = styled.em`
  color: #999;
`;

export const SuccessNotice = styled.div`
  padding: 8px 12px;
  margin-top: 16px;
  color: #0f7a3e;
  background: #eafaf1;
  border-radius: 6px;
`;

export const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
`;

export const ProgressTrack = styled.div`
  height: 8px;
  margin-top: 4px;
  overflow: hidden;
  background: #eee;
  border-radius: 6px;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => `${$pct}%`};
  height: 100%;
  background: #1677ff;
  transition: width 200ms linear;
`;
