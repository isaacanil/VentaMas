import React, { Fragment } from 'react';
import styled from 'styled-components';

import { PageBody } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { ProviderTable } from './components/OrderListTable/ProviderTable';

export const ProviderAdmin = () => {
  return (
    <Fragment>
      <MenuApp sectionName="Proveedores" />
      <Container>
        <ProviderTable />
      </Container>
    </Fragment>
  );
};
const Container = styled(PageBody)`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color2);
`;
