import React from 'react';
import { Button } from 'antd';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0rem 0em;
  background: var(--White);
`;

export const FilterBar = ({ filterStatus, setFilterStatus, openAccountsCount = 0, closedAccountsCount = 0 }) => {
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