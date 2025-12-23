import React from 'react';
import styled from 'styled-components';

import { UserSection } from '@/views/pages/CashReconciliation/resource/UserSection/UserSection';

export const Header = () => {
  return (
    <Container>
      <UserSection />
    </Container>
  );
};

const Container = styled.div``;
