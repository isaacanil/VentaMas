import React from 'react';
import styled from 'styled-components';
import { UserSection } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/UserSection/UserSection';

export const Header: React.FC = () => {
  return (
    <Container>
      <UserSection />
    </Container>
  );
};

const Container = styled.div``;
