import { Suspense, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { lazyWithRetry } from '../../../../utils/lazyWithRetry';

import {
  findToolbarEntry,
  type ToolbarComponentProps,
} from './GlobalMenuRegistry';

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

  const ToolbarComponent = useMemo(() => {
    if (!activeEntry) {
      return null;
    }

    return lazyWithRetry(activeEntry.loader, `GlobalMenu:${activeEntry.id}`);
  }, [activeEntry]);

  if (!ToolbarComponent || !activeEntry) {
    return null;
  }

  return (
    <Container key={activeEntry.id}>
      <Suspense fallback={null}>
        <LeftSide>
          <ToolbarComponent side="left" {...props} />
        </LeftSide>
        <RightSide>
          <ToolbarComponent side="right" {...props} />
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
