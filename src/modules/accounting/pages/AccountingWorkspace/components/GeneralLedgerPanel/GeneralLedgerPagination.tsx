import { Pagination } from 'antd';
import styled from 'styled-components';

import type { GeneralLedgerSnapshot } from '../../utils/accountingWorkspace';

interface GeneralLedgerPaginationProps {
  pagination: GeneralLedgerSnapshot['pagination'];
  onChange: (page: number) => void;
}

export const GeneralLedgerPagination = ({
  pagination,
  onChange,
}: GeneralLedgerPaginationProps) => (
  <PaginationRow>
    <PaginationInfo>
      Mostrando {(pagination.page - 1) * pagination.pageSize + 1}–
      {Math.min(pagination.page * pagination.pageSize, pagination.totalEntries)} de{' '}
      {pagination.totalEntries} movimientos
    </PaginationInfo>
    <Pagination
      current={pagination.page}
      pageSize={pagination.pageSize}
      total={pagination.totalEntries}
      showSizeChanger={false}
      onChange={onChange}
    />
  </PaginationRow>
);

const PaginationRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PaginationInfo = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
