import { Spin } from 'antd';
import { lazy, Suspense, useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { MenuWebsite } from '@/modules/home/components/MenuWebsite/MenuWebsite';
import { normalizeAvailableBusinesses } from '@/modules/auth/utils/businessContext';
import {
  hasBusinessManagerQuery,
  withoutBusinessManagerQuery,
} from '@/modules/auth/utils/businessManagerRoute';
import ROUTES_NAME from '@/router/routes/routesName';
import type { UserRoleLike } from '@/types/users';
import { hasBusinessOwnershipClaimIssueAccess } from '@/utils/access/businessOwnershipClaimIssueAccess';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { AppVersionBadge } from './components/AppVersionBadge/AppVersionBadge';
import { BusinessInfoPill } from './components/BusinessInfoPill/BusinessInfoPill';
import { HomeOnboardingEmptyState } from './components/Onboarding/HomeOnboardingEmptyState';
import { SubscriptionStatusBanner } from './components/SubscriptionStatusBanner/SubscriptionStatusBanner';

import type { JSX } from 'react';

const DashboardShortcuts = lazy(() =>
  import('./components/DashboardShortcuts/DashboardShortcuts').then(
    (module) => ({ default: module.DashboardShortcuts }),
  ),
);

type AuthUser = {
  role?: UserRoleLike | null;
  businessHasOwners?: boolean | null;
} | null | false;
type HomeUserMeta = {
  authReady: boolean;
  hasUser: boolean;
  role: UserRoleLike | null;
  businessHasOwners: boolean | null;
  isDeveloper: boolean;
  canIssueOwnershipClaim: boolean;
  hasBusinesses: boolean;
  displayName: string | null;
};

interface RootState {
  user?: {
    user?: AuthUser;
  };
}

const selectHomeUserMeta = (state: RootState): HomeUserMeta => {
  const user = state.user?.user;
  if (user === undefined || user === false || user === null) {
    return {
      authReady: Boolean(state.user?.authReady),
      hasUser: false,
      role: null,
      businessHasOwners: null,
      isDeveloper: false,
      canIssueOwnershipClaim: false,
      hasBusinesses: false,
      displayName: null,
    };
  }
  if (typeof user !== 'object') {
    return {
      authReady: Boolean(state.user?.authReady),
      hasUser: false,
      role: null,
      businessHasOwners: null,
      isDeveloper: false,
      canIssueOwnershipClaim: false,
      hasBusinesses: false,
      displayName: null,
    };
  }

  const role = user.role ?? null;
  const businessHasOwners =
    typeof user.businessHasOwners === 'boolean'
      ? user.businessHasOwners
      : null;
  const isDeveloper = hasDeveloperAccess(user);
  const canIssueOwnershipClaim = hasBusinessOwnershipClaimIssueAccess(user);
  const hasBusinesses = normalizeAvailableBusinesses(user).length > 0;
  const displayName =
    (typeof user.displayName === 'string' && user.displayName.trim()) ||
    (typeof user.realName === 'string' && user.realName.trim()) ||
    (typeof user.name === 'string' && user.name.trim()) ||
    null;

  return {
    authReady: Boolean(state.user?.authReady),
    hasUser: true,
    role,
    businessHasOwners,
    isDeveloper,
    canIssueOwnershipClaim,
    hasBusinesses,
    displayName,
  };
};

export interface HomeProps {
  developerMode?: boolean;
}

export const Home = ({ developerMode = false }: HomeProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    authReady,
    hasUser,
    businessHasOwners,
    isDeveloper,
    canIssueOwnershipClaim,
    hasBusinesses,
    displayName,
  } = useSelector(
    selectHomeUserMeta,
    shallowEqual,
  );
  const business = useSelector(selectBusinessData, shallowEqual);
  const user = useSelector(selectUser, shallowEqual);
  const shouldForceOpenBusinessManager = hasBusinessManagerQuery(location.search);

  const handleBusinessManagerOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen || !shouldForceOpenBusinessManager) return;
      const cleanPath = withoutBusinessManagerQuery(
        `${location.pathname}${location.search}`,
      );
      navigate(cleanPath, { replace: true });
    },
    [location.pathname, location.search, navigate, shouldForceOpenBusinessManager],
  );

  if (!authReady || !hasUser) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (!developerMode && isDeveloper) {
    return (
      <Navigate
        to={`${ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB}${location.search}`}
        replace
      />
    );
  }

  const shouldShowVersionBadge = developerMode && isDeveloper;
  const shouldShowMissingOwnerBadge =
    hasBusinesses &&
    canIssueOwnershipClaim &&
    businessHasOwners === false;

  return (
    <HomeLayout>
      <MenuWebsite />
      {hasBusinesses ? (
        <TopInfoRow>
          <BusinessInfoPill
            forceWorkspaceOpen={shouldForceOpenBusinessManager}
            onWorkspaceOpenChange={handleBusinessManagerOpenChange}
          />
          <BadgesRow>
            {shouldShowMissingOwnerBadge && (
              <MissingOwnerBadge>Sin propietario</MissingOwnerBadge>
            )}
            {shouldShowVersionBadge && <AppVersionBadge showLabel={false} />}
          </BadgesRow>
        </TopInfoRow>
      ) : (
        <TopInfoRow>
          <BadgesRow>
            {shouldShowVersionBadge && <AppVersionBadge showLabel={false} />}
          </BadgesRow>
        </TopInfoRow>
      )}
      <MainContent>
        <MainContentInner>
          {!hasBusinesses ? (
            <HomeOnboardingEmptyState displayName={displayName} />
          ) : (
            <Suspense
              fallback={
                <LoadingContainer style={{ height: '200px', background: 'none' }}>
                  <Spin />
                </LoadingContainer>
              }
            >
              <SubscriptionStatusBanner business={business} user={user} />
              <DashboardShortcuts includeDeveloperFeatures={developerMode} />
            </Suspense>
          )}
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

const BadgesRow = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
`;

const MissingOwnerBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #9f1239;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgb(251 113 133 / 16%);
  border: 1px solid rgb(251 113 133 / 45%);
  border-radius: 999px;
`;
