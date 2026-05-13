import { Spin } from 'antd';
import { lazy, Suspense, useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  selectBusinessData,
  selectBusinessLoading,
} from '@/features/auth/businessSlice';
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
import { zIndex } from '@/design-system/tokens/zIndex';

import { HomeOnboardingEmptyState } from './components/Onboarding/HomeOnboardingEmptyState';
import { SubscriptionStatusBanner } from './components/SubscriptionStatusBanner/SubscriptionStatusBanner';

import type { JSX } from 'react';

const DashboardShortcuts = lazy(() =>
  import('./components/HomeDashboard/HomeDashboard').then(
    (module) => ({ default: module.HomeDashboard }),
  ),
);

type AuthUser = {
  role?: UserRoleLike | null;
  activeBusinessId?: string | null;
  businessId?: string | null;
  businessID?: string | null;
  businessHasOwners?: boolean | null;
  displayName?: string | null;
  realName?: string | null;
  name?: string | null;
  [key: string]: unknown;
} | null | false;
type HomeUserMeta = {
  authReady: boolean;
  hasUser: boolean;
  role: UserRoleLike | null;
  activeBusinessId: string | null;
  businessHasOwners: boolean | null;
  isDeveloper: boolean;
  canIssueOwnershipClaim: boolean;
  hasBusinesses: boolean;
  displayName: string | null;
};

interface RootState {
  user?: {
    user?: AuthUser;
    authReady?: boolean;
  };
}

const selectHomeUserMeta = (state: RootState): HomeUserMeta => {
  const user = state.user?.user;
  if (user === undefined || user === false || user === null) {
    return {
      authReady: Boolean(state.user?.authReady),
      hasUser: false,
      role: null,
      activeBusinessId: null,
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
      activeBusinessId: null,
      businessHasOwners: null,
      isDeveloper: false,
      canIssueOwnershipClaim: false,
      hasBusinesses: false,
      displayName: null,
    };
  }

  const role = user.role ?? null;
  const activeBusinessId =
    (typeof user.activeBusinessId === 'string' && user.activeBusinessId.trim()) ||
    (typeof user.businessId === 'string' && user.businessId.trim()) ||
    (typeof user.businessID === 'string' && user.businessID.trim()) ||
    null;
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
    activeBusinessId,
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
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const {
    authReady,
    hasUser,
    activeBusinessId,
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
  const businessLoading = useSelector(selectBusinessLoading);
  const user = useSelector(selectUser, shallowEqual);
  const shouldForceOpenBusinessManager = hasBusinessManagerQuery(search);
  const isBusinessContextPending =
    Boolean(activeBusinessId) &&
    (businessLoading || business?.id !== activeBusinessId);

  const handleBusinessManagerOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen || !shouldForceOpenBusinessManager) return;
      const cleanPath = withoutBusinessManagerQuery(
        `${pathname}${search}`,
      );
      navigate(cleanPath, { replace: true });
    },
    [pathname, search, navigate, shouldForceOpenBusinessManager],
  );

  if (!authReady || !hasUser || isBusinessContextPending) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (!developerMode && isDeveloper) {
    return (
      <Navigate
        to={`${ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB}${search}`}
        replace
      />
    );
  }

  const shouldShowMissingOwnerBadge =
    hasBusinesses &&
    canIssueOwnershipClaim &&
    businessHasOwners === false;

  return (
    <HomeLayout>
      <PageScroll>
        <StickyTopBar>
          <MenuWebsite
            forceWorkspaceOpen={shouldForceOpenBusinessManager}
            includeDeveloperFeatures={developerMode}
            onWorkspaceOpenChange={handleBusinessManagerOpenChange}
            showBusinessSelector={hasBusinesses}
          />
          {shouldShowMissingOwnerBadge && (
            <BadgesRow>
              <MissingOwnerBadge>Sin propietario</MissingOwnerBadge>
            </BadgesRow>
          )}
        </StickyTopBar>
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
                <DashboardShortcuts
                  businessName={business?.name ?? null}
                  displayName={displayName}
                  includeDeveloperFeatures={developerMode}
                />
              </Suspense>
            )}
          </MainContentInner>
        </MainContent>
      </PageScroll>
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
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color2);
`;

const PageScroll = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

const StickyTopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: ${zIndex.sticky};
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: center;
  width: 100%;
  padding: 0.25rem 1rem 0.45rem;
  background: transparent;
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  justify-content: center;
  min-height: 0;
  width: 100%;
  padding: 0 1rem 1em;
  overflow: visible;
`;

const MainContentInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: stretch;
  width: min(1200px, 100%);
  margin: 0 auto;
`;

const BadgesRow = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  width: min(1200px, 100%);
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
