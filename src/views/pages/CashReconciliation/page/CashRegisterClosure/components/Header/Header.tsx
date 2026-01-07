import React from 'react';
import styled from 'styled-components';
import { CashCountStateIndicator } from '@/views/pages/CashReconciliation/resource/CashCountStatusIndicator/CashCountStateIndicator';
import { UserSection } from './../../../../resource/UserSection/UserSection';
import type { CashCountState } from '@/utils/cashCount/types';

interface HeaderProps {
  state?: CashCountState | null;
}

export const Header: React.FC<HeaderProps> = ({ state = 'closed' }) => {
  return (
    <Container>
      <Row>
        <Group>
          <UserSection />
        </Group>
        <Group>
          <CashCountStateIndicator state={state || 'closed'} />
        </Group>
      </Row>
    </Container>
  );
};
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;

const Container = styled.div`
  padding: 0.4em;
  background-color: white;
  border: var(--border-primary);
  border-radius: var(--border-radius);
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
