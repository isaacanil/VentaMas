// @ts-nocheck
import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { MenuWebsite } from '@/modules/home/components/MenuWebsite/MenuWebsite';

import { AppVersionBadge } from './components/AppVersionBadge/AppVersionBadge';
import { BusinessInfoPill } from './components/BusinessInfoPill/BusinessInfoPill';

import type { JSX } from 'react';

const DashboardShortcuts = lazy(() =>
  import('./components/DashboardShortcuts/DashboardShortcuts').then(
    (module) => ({ default: module.DashboardShortcuts }),
  ),
);

interface RootState {
  user?: {
    user?:
    | {
      role?: string | null;
    }
    | null
    | boolean;
  };
}

// Memoized selector to extract user role
const selectUserRole = (state: RootState): string | null | false => {
  const user = state.user?.user;
  if (user === undefined) return false;
  if (user === false || user === null) return false;
  if (typeof user === 'object') return user.role ?? null;
  return false;
};

export const Home = (): JSX.Element => {
  const userRole = useSelector(selectUserRole, shallowEqual) as
    | string
    | null
    | false;

  if (!userRole) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  const shouldShowVersionBadge = userRole === 'dev';

  return (
    <HomeLayout>
      <MenuWebsite />
      <TopInfoRow>
        <BusinessInfoPill />
        {shouldShowVersionBadge && <AppVersionBadge showLabel={false} />}
      </TopInfoRow>
      <MainContent>
        <MainContentInner>
          <Suspense
            fallback={
              <LoadingContainer style={{ height: '200px', background: 'none' }}>
                <Spin />
              </LoadingContainer>
            }
          >
            <DashboardShortcuts />
          </Suspense>
        </MainContentInner>
      </MainContent>
    </HomeLayout>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: var(--color2);
`;

const HomeLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  min-height: 100vh;
  padding-bottom: 2rem;
  background-color: var(--color2);
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  justify-content: center;
  width: 100%;
  padding: 0 1rem;
  overflow-y: auto;
`;

const MainContentInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: stretch;
  width: min(1200px, 100%);
  margin: 0 auto;
`;

const TopInfoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: min(1200px, calc(100% - 2rem));
  padding: 0.2em 0;
  margin: 0 auto;
`;
