import { Alert, message, Tabs } from 'antd';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { getRoleLabelById } from '@/abilities/roles';
import { fbRevokeSession } from '@/firebase/Auth/fbAuthV2/fbRevokeSession';
import ROUTES_NAME from '@/router/routes/routesName';

import { SessionsTable } from './UserActivity/components/SessionsTable';
import { UserActivityCharts } from './UserActivity/components/UserActivityCharts';
import { UserActivityHeader } from './UserActivity/components/UserActivityHeader';
import { UserActivityList } from './UserActivity/components/UserActivityList';
import { UserActivitySummary } from './UserActivity/components/UserActivitySummary';
import { UserInfoCard } from './UserActivity/components/UserInfoCard';
import {
  useUserActivityData,
  type PresenceState,
  type UserActivityUser,
} from './UserActivity/hooks/useUserActivityData';
import { useUserRealActivity } from './UserActivity/hooks/useUserRealActivity';
import {
  formatDateTime,
  type SessionSummary,
} from './UserActivity/utils/activityUtils';

const {
  SETTING_TERM: { USERS, USERS_LIST },
} = ROUTES_NAME;

interface UserActivityLocationState {
  user?: UserActivityUser | null;
  presence?: PresenceState | null;
}

export const UserActivity = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const usersListRoute = `${USERS}/${USERS_LIST}`;
  const state = location.state as UserActivityLocationState | null | undefined;
  const initialUser = state?.user || null;
  const initialPresence = state?.presence || null;
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );

  const {
    userInfo,
    statusTag,
    statusLabel,
    resolvedLastSeen,
    lastLogin,
    lastLogout,
    sessions,
    loadingLogs,
    loadingUser,
    loadActivity,
    showError,
    errorMessage,
  } = useUserActivityData({
    userId: userId ?? null,
    initialUser,
    initialPresence,
  });

  const {
    activities,
    stats,
    loading: loadingActivity,
    error: errorActivity,
    refetch: refetchActivity,
  } = useUserRealActivity({
    userId: userId ?? null,
    businessId: userInfo?.businessID,
  });

  const handleRefresh = useCallback(() => {
    loadActivity();
    refetchActivity();
  }, [loadActivity, refetchActivity]);

  const handleCloseSession = useCallback(
    (session: SessionSummary) => {
      if (!session?.sessionId) {
        message.error('No se pudo identificar la sesion.');
        return;
      }

      setRevokingSessionId(session.sessionId);
      const hide = message.loading('Cerrando sesion...', 0);
      void fbRevokeSession({ userId, sessionId: session.sessionId })
        .then(
          () => {
            hide();
            message.success('Sesion cerrada correctamente.');
            return loadActivity();
          },
          (error) => {
            hide();
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'No se pudo cerrar la sesion.';
            message.error(errorMessage);
            return null;
          },
        )
        .then(() => {
          setRevokingSessionId(null);
        });
    },
    [loadActivity, userId],
  );

  const loading = loadingLogs || loadingUser;
  const lastSeenLabel = resolvedLastSeen
    ? formatDateTime(resolvedLastSeen)
    : 'Sin datos';
  const lastLoginLabel = lastLogin
    ? formatDateTime(lastLogin.createdAt)
    : 'Sin datos';
  const lastLogoutLabel = lastLogout
    ? formatDateTime(lastLogout.createdAt)
    : 'Sin datos';
  const emptyText = loading
    ? 'Cargando historial...'
    : 'No hay actividad registrada.';

  const items = [
    {
      key: 'activity',
      label: 'Actividad Reciente',
      children: (
        <TabContentWrapper>
          <UserActivityCharts stats={stats} />
          <UserActivityList
            activities={activities}
            loading={loadingActivity}
            error={errorActivity}
          />
        </TabContentWrapper>
      ),
    },
    {
      key: 'sessions',
      label: 'Sesiones',
      children: (
        <TabContentWrapper>
          <UserActivitySummary
            lastLoginLabel={lastLoginLabel}
            lastLogoutLabel={lastLogoutLabel}
            sessionsCount={sessions.length || 0}
          />

          {showError && (
            <AlertWrapper>
              <Alert
                type="error"
                message="No se pudo cargar la actividad"
                description={errorMessage}
                showIcon
              />
            </AlertWrapper>
          )}

          <SessionsTable
            sessions={sessions}
            loading={loading}
            emptyText={emptyText}
            onCloseSession={handleCloseSession}
            revokingSessionId={revokingSessionId}
          />
        </TabContentWrapper>
      ),
    },
  ];

  return (
    <Wrapper>
      <UserActivityHeader
        onBack={() => navigate(usersListRoute)}
        onRefresh={handleRefresh}
        loading={loadingLogs || loadingActivity}
      />

      <UserInfoCard
        name={userInfo?.name || 'Usuario'}
        roleLabel={userInfo?.role ? getRoleLabelById(userInfo.role) : null}
        active={userInfo?.active}
        statusTag={statusTag}
        statusLabel={statusLabel}
        lastSeenLabel={lastSeenLabel}
      />

      <Tabs defaultActiveKey="activity" items={items} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  height: 100%;
  min-height: 0;
  padding: 1.5rem;
  background-color: ${({ theme }) =>
    theme?.palette?.background?.light || '#f8f8f8'};
  overflow-y: auto;
`;

const TabContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
`;

const AlertWrapper = styled.div`
  width: 100%;
`;

export default UserActivity;
