import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite';

import { AppVersionBadge } from './components/AppVersionBadge/AppVersionBadge';
import { BusinessInfoPill } from './components/BusinessInfoPill/BusinessInfoPill';
import { DashboardShortcuts } from './components/DashboardShortcuts/DashboardShortcuts';

import type { JSX } from 'react';

type RootState = {
  user?: {
    user?: {
      role?: string | null;
    } | null;
  };
};

export const Home = (): JSX.Element => {
  const userRole = useSelector<RootState, string | null>((state) =>
    typeof state.user?.user?.role === 'string' ? state.user.user.role : null,
  );
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
          <DashboardShortcuts />
        </MainContentInner>
      </MainContent>
    </HomeLayout>
  );
};

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
  width: 100%;
  max-width: 1200px;
  padding: 0.2em 0;
  margin: 0 auto;
`;
