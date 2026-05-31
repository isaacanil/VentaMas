import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

export const SummaryLabel = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

export const SummaryValue = styled.p`
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

export const SummaryNote = styled.p`
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.78rem;
`;

export const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 360px;
`;

export const SearchIconWrap = styled.span`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.82rem;
  pointer-events: none;
  z-index: 1;
`;

export const TableCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  padding: 10px 16px;
  text-align: left;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

export const ThRight = styled(Th)`
  text-align: right;
`;

export const Tr = styled.tr<{ $last: boolean }>`
  border-bottom: ${(p) => (p.$last ? 'none' : '1px solid #f1f5f9')};
  transition: background 0.1s;

  &:hover {
    background: #f8fafc;
  }
`;

export const Td = styled.td<{ $muted?: boolean; $bold?: boolean }>`
  padding: 10px 16px;
  color: ${(p) => (p.$muted ? '#64748b' : '#0f172a')};
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$bold ? 600 : 400)};
  vertical-align: middle;
`;

export const TdRight = styled(Td)`
  text-align: right;
`;

export const InvoiceLink = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: #0d9488;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: text-decoration 0.1s;

  &:hover {
    text-decoration: underline;
  }
`;

export const ActionGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  color: #94a3b8;
  font-size: 0.9rem;

  svg {
    font-size: 1.6rem;
  }
`;

export const StatusBadge = styled.span<{
  $bg: string;
  $color: string;
  $border: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.$border};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

export const ModalTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ModalInvoiceNumber = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 600;
`;

export const ModalInvoiceDate = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.875rem;
`;

export const ModalDivider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

export const DetailRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const DetailRowWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const DetailLabel = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

export const DetailValue = styled.span`
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: right;
`;

export const ModalTotal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ModalTotalLabel = styled.span`
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
`;

export const ModalTotalValue = styled.span`
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 10px;
`;
