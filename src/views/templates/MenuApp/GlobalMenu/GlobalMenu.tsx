// @ts-nocheck
import { Suspense, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { findToolbarEntry, type ToolbarComponentProps } from './GlobalMenuRegistry';

import type { Dispatch, FC, SetStateAction } from 'react';

export interface GlobalMenuProps extends Omit<ToolbarComponentProps, 'side'> {
  data?: unknown;
  searchData?: string;
  setSearchData?: Dispatch<SetStateAction<string>>;
  onReportSaleOpen?: () => void;
}

export const GlobalMenu: FC<GlobalMenuProps> = (props) => {
  const location = useLocation();

  const activeEntry = useMemo(
    () => findToolbarEntry(location.pathname),
    [location.pathname],
  );

  if (!activeEntry) return null;

  const ToolbarComponent = activeEntry.Component;

  return (
    <Container key={activeEntry.id}>
      <Suspense fallback={null}>
        <LeftSide>
          <ToolbarComponent {...props} side="left" />
        </LeftSide>
        <RightSide>
          <ToolbarComponent {...props} side="right" />
        </RightSide>
      </Suspense>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
`;
const LeftSide = styled.div``;
const RightSide = styled.div``;
