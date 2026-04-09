import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';

export const Page = styled(PageShell)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem;
`;

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  overflow-y: auto;
  box-sizing: border-box;
`;

export const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const LeftFilters = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;

  & > * {
    flex: 0 0 auto;
  }

  @media (width <= 420px) {
    flex-wrap: wrap;
  }
`;

export const RightActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

export const Card = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid rgb(0 0 0 / 6%);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
`;

export const KpiTitle = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const KpiValue = styled.div`
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
`;

export const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;

  @media (width >= 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const SectionCard = styled(Card)``;

export const SectionCardWide = styled(SectionCard)`
  @media (width >= 1280px) {
    grid-column: span 1;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
`;

export const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;

  thead tr {
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }

  th,
  td {
    padding: 8px 12px;
    text-align: left;
  }

  tbody tr {
    border-bottom: 1px solid #f3f4f6;
  }

  td.num {
    text-align: right;
    white-space: nowrap;
  }

  th.num {
    text-align: right;
  }
`;

export const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #6b7280;
`;
