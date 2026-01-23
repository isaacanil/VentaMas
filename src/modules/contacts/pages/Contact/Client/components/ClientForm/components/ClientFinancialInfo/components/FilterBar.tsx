import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0;
  background: var(--white);
`;

type FilterStatus = 'open' | 'closed';

type FilterBarProps = {
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  openAccountsCount?: number;
  closedAccountsCount?: number;
};

export const FilterBar = ({
  filterStatus,
  setFilterStatus,
  openAccountsCount = 0,
  closedAccountsCount = 0,
}: FilterBarProps) => {
  return (
    <Bar>
      <Button.Group>
        <Button
          type={filterStatus === 'open' ? 'primary' : 'default'}
          onClick={() => setFilterStatus('open')}
        >
          Abiertas {openAccountsCount}
        </Button>
        <Button
          type={filterStatus === 'closed' ? 'primary' : 'default'}
          onClick={() => setFilterStatus('closed')}
        >
          Cerradas {closedAccountsCount}
        </Button>
      </Button.Group>
    </Bar>
  );
};
