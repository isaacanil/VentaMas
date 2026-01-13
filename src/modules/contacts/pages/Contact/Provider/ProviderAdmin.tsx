// @ts-nocheck
import React, { Fragment } from 'react';
import styled from 'styled-components';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { ProviderTable } from './components/OrderListTable/ProviderTable';
import { ToolBar } from './ToolBar';

export const ProviderAdmin = () => {
  return (
    <Fragment>
      <MenuApp></MenuApp>
      <Container>
        <ToolBar></ToolBar>
        <ProviderTable />
      </Container>
    </Fragment>
  );
};
const Container = styled.div`
  display: grid;
  grid-auto-rows: min-content;
  align-items: flex-start;
  justify-content: center;
  width: 100vw;
  height: calc(100vh - 2.75em);
  overflow: hidden;
  background-color: var(--color2);
`;

