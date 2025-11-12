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
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background-color: var(--color2);
  padding-bottom: 2rem;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
  overflow-y: auto;
`;

const MainContentInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.25rem;
  width: min(1200px, 100%);
  margin: 0 auto;
`;

const TopInfoRow = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  padding: 0.2em 0;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;
