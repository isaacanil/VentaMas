import React from 'react';
import styled from 'styled-components';

import { CashCountStateIndicator } from '../../../../resource/CashCountStatusIndicator/CashCountStateIndicator';

import { UserSection } from './../../../../resource/UserSection/UserSection';

export const Header = ({ state = 'closed' }) => {
  return (
    <Container>
      <Row>
        <Group>
          <UserSection />
        </Group>
        <Group>
          {/* <DateSection />   */}
          <CashCountStateIndicator state={state}></CashCountStateIndicator>
          {/* <CashReconciliationState state={state}/> */}
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

  /* height: 4.4em; */
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
