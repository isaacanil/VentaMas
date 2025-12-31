import {
  CheckCircleOutlined,
  EditOutlined,
  FieldTimeOutlined,
  KeyOutlined,
  MoreOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, Input } from 'antd';
import { onValue, ref } from 'firebase/database';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  getRoleLabelById,
  userRoles,
} from '@/abilities/roles';
import { selectUser } from '@/features/auth/userSlice';
import { toggleSignUpUser } from '@/features/modals/modalSlice';
import { updateUser } from '@/features/usersManagement/usersManagementSlice';
import { realtimeDB } from '@/firebase/firebaseconfig.jsx';
import { fbGetUsers } from '@/firebase/users/fbGetUsers';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import ROUTES_NAME from '@/router/routes/routesName';
import { getAvailablePermissionsForRole } from '@/services/dynamicPermissions';
import DynamicPermissionsManager from '@/views/pages/setting/subPage/Users/components/DynamicPermissionsManager';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import { ChangeUserPasswordModal } from './ChangeUserPasswordModal';
import { ToggleUserStatusModal } from './ToggleUserStatusModal';

const Role = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.35em 0.9em;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $primaryColor }) => $primaryColor};
  text-transform: capitalize;
  background-color: ${({ $secondaryColor }) => $secondaryColor};
  border: 1px solid ${({ $primaryColor }) => $primaryColor};
  border-radius: 999px;
`;

const IndexBadge = styled.div`
  display: grid;
  place-items: center;
  width: 2.5em;
  height: 2.5em;
  font-weight: 600;
  color: ${({ theme }) => theme?.text?.secondary ?? '#344054'};
  background: ${({ theme }) => theme?.bg?.tertiary ?? 'rgba(15, 23, 42, 0.08)'};
  border: 1px solid
    ${({ theme }) => theme?.border?.primary ?? 'rgba(15, 23, 42, 0.08)'};
  border-radius: 12px;
`;

const NameCell = styled.div`
  display: flex;
  gap: 0.75em;
  align-items: center;
`;

const NameContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15em;

  .name {
    font-weight: 500;
    color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
  }

  .meta {
    font-size: 0.75rem;
    color: ${({ theme }) => theme?.text?.secondary ?? '#6B7280'};
  }
`;

const DateCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15em;

  .date {
    font-weight: 500;
    color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35em 0.9em;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#0F5132' : '#4F6275')};
  text-transform: capitalize;
  background: ${({ $active }) =>
    $active ? 'rgba(25, 135, 84, 0.12)' : 'rgba(148, 163, 184, 0.18)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(25, 135, 84, 0.35)' : 'rgba(148, 163, 184, 0.35)'};
  border-radius: 999px;
`;

const PresenceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  width: fit-content;
  padding: 0.2em 0.45em;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $online }) => ($online ? '#0D6832' : '#4F6275')};
  background: ${({ $online }) =>
    $online ? 'rgba(13, 104, 50, 0.08)' : 'rgba(148, 163, 184, 0.12)'};
  border: 1px solid
    ${({ $online }) => ($online ? 'rgba(13, 104, 50, 0.28)' : 'rgba(148, 163, 184, 0.25)')};
  border-radius: 12px;

  .presence-dot {
    font-size: 0.65rem;
    color: ${({ $online }) => ($online ? '#1DB954' : '#94A3B8')};
    filter: drop-shadow(
      ${({ $online }) =>
        $online ? '0 0 4px rgba(29, 185, 84, 0.5)' : 'none'}
    );
  }
`;

const toMillis = (value) => {
  if (typeof value === 'number') return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  ) {
    return value.seconds * 1000 + value.nanoseconds / 1_000_000;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value._seconds === 'number' &&
    typeof value._nanoseconds === 'number'
  ) {
    return value._seconds * 1000 + value._nanoseconds / 1_000_000;
  }
  return null;
};

const {
  SETTING_TERM: { USERS, USERS_ACTIVITY_DETAIL },
} = ROUTES_NAME;

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});
  const currentUser = useSelector(selectUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { abilities, loading: permissionsLoading } = useUserAccess();
  const canManageDynamicPermissions = abilities.can('manage', 'users');

  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map(({ user }) => user?.uid || user?.id)
            .filter(Boolean)
            .map(String),
        ),
      ),
    [users],
  );

  const presenceMapForUsers = useMemo(() => {
    if (userIds.length === 0) return {};
    const allowed = new Set(userIds);
    return Object.fromEntries(
      Object.entries(presenceMap).filter(([uid]) => allowed.has(String(uid))),
    );
  }, [presenceMap, userIds]);

  useEffect(() => {
    let mounted = true;
    const loadUsers = () => {
      if (mounted) {
        setLoading(true);
      }
      fbGetUsers(currentUser, setUsers, null, () => {
        if (mounted) {
          setLoading(false);
        }
      });
    };
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!realtimeDB?.app?.options?.databaseURL) return undefined;

    if (userIds.length === 0) {
      return undefined;
    }

    const unsubscribes = userIds.map((uid) => {
      const presenceRef = ref(realtimeDB, `presence/${uid}`);
      return onValue(presenceRef, (snapshot) => {
        const value = snapshot?.val();
        let state = 'offline';
        let lastUpdated = null;
        if (value && typeof value === 'object') {
          const connections = Object.values(value);
          const onlineConnection = connections.find(
            (connection) => connection?.state === 'online',
          );
          state = onlineConnection ? 'online' : 'offline';
          const timestamps = connections
            .map((connection) => toMillis(connection?.updatedAt))
            .filter((ts) => typeof ts === 'number');
          if (timestamps.length) {
            lastUpdated = Math.max(...timestamps);
          }
        }

        setPresenceMap((prev) => ({
          ...prev,
          [uid]: { state, lastUpdated },
        }));
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        try {
          unsubscribe?.();
        } catch {
          /* ignore */
        }
      });
    };
  }, [userIds]);

  const data = useMemo(
    () =>
      users.map(({ user }) => {
        const name = user?.name || 'Usuario sin nombre';
        const email = user?.email || user?.username || '';
        const isActive = Boolean(user?.active);
        const statusLabel = isActive ? 'Activo' : 'Inactivo';
        const userId = user?.uid || user?.id;
        const presence = presenceMapForUsers[userId] || { state: 'offline' };

        return {
          number: user?.number,
          name: {
            displayName: name,
            email,
          },
          createAt: user?.createAt,
          role: user?.role,
          status: {
            active: isActive,
            label: statusLabel,
          },
          presence,
          user,
          searchText:
            `${name} ${email} ${statusLabel} ${presence?.state ?? ''} ${
              getRoleLabelById(user?.role) ?? ''
            }`.toLowerCase(),
        };
      }),
    [users, presenceMapForUsers],
  );

  const sortedData = useMemo(() => {
    const getBucket = (presence) => {
      const isOnline = presence?.state === 'online';
      const lastSeen = typeof presence?.lastUpdated === 'number' ? presence.lastUpdated : null;
      if (isOnline) return { bucket: 0, lastSeen };
      if (lastSeen) return { bucket: 1, lastSeen };
      return { bucket: 2, lastSeen: null };
    };

    const getCreatedAt = (value) => toMillis(value) ?? 0;

    return [...data].sort((a, b) => {
      const aBucket = getBucket(a.presence);
      const bBucket = getBucket(b.presence);

      if (aBucket.bucket !== bBucket.bucket) {
        return aBucket.bucket - bBucket.bucket;
      }

      // When in the same bucket, sort by lastSeen desc if available, else by creation date desc
      const aLast = aBucket.lastSeen ?? getCreatedAt(a.createAt);
      const bLast = bBucket.lastSeen ?? getCreatedAt(b.createAt);
      return bLast - aLast;
    });
  }, [data]);

  const handleViewActivity = useCallback(
    (user) => {
      const userId = user?.uid || user?.id;
      if (!userId) return;
      const path = `${USERS}/${USERS_ACTIVITY_DETAIL.replace(
        ':userId',
        encodeURIComponent(userId),
      )}`;
      navigate(path, {
        state: {
          user,
          presence: presenceMap[userId],
        },
      });
    },
    [navigate, presenceMap],
  );

  const handleEditUser = useCallback(
    (user) => {
      // Solo permitir editar si tiene permisos
      if (abilities.can('manage', 'User')) {
        dispatch(updateUser(user));
        dispatch(
          toggleSignUpUser({
            isOpen: true,
            data: user,
            businessID: user?.businessID,
          }),
        );
      }
    },
    [abilities, dispatch],
  );

  const openPasswordModal = useCallback((user) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  }, []);

  const openStatusModal = useCallback((user) => {
    setSelectedUser(user);
    setIsStatusModalOpen(true);
  }, []);

  const openPermissionsModal = useCallback(
    (user) => {
      if (!canManageDynamicPermissions) return;
      setSelectedUser(user);
      setIsPermissionsModalOpen(true);
    },
    [canManageDynamicPermissions],
  );

  const closePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
    setSelectedUser(null);
  }, []);

  const closeStatusModal = useCallback(() => {
    setIsStatusModalOpen(false);
    setSelectedUser(null);
  }, []);

  const closePermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(false);
    setSelectedUser(null);
  }, []);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        Header: '#',
        accessor: 'number',
        align: 'left',
        maxWidth: '0.2fr',
        minWidth: '60px',
        cell: ({ value }) => <IndexBadge>{value ?? '--'}</IndexBadge>,
      },
      {
        Header: 'Nombre',
        accessor: 'name',
        align: 'left',
        maxWidth: '1fr',
        minWidth: '150px',
        cell: ({ value }) => (
          <NameCell>
            <NameContent>
              <span className="name">
                {value?.displayName ?? 'Usuario sin nombre'}
              </span>
              {value?.email && <span className="meta">{value.email}</span>}
            </NameContent>
          </NameCell>
        ),
      },
      {
        Header: 'Fecha de Creación',
        accessor: 'createAt',
        align: 'left',
        maxWidth: '0.8fr',
        cell: ({ value }) => {
          if (!value?.seconds) {
            return <span>Sin registro</span>;
          }

          const dateObject = DateTime.fromSeconds(value.seconds);

          return (
            <DateCell>
              <span className="date">
                {dateObject.toLocaleString(DateTime.DATE_SHORT)}
              </span>
            </DateCell>
          );
        },
      },
      {
        Header: 'Rol',
        accessor: 'role',
        align: 'left',
        cell: ({ value }) => {
          const role = userRoles.find((r) => r.id === value) || {};

          return (
            <Role
              $primaryColor={role.primaryColor}
              $secondaryColor={role.secondaryColor}
            >
              {getRoleLabelById(value)}
            </Role>
          );
        },
      },
      {
        Header: 'Estado',
        accessor: 'status',
        align: 'left',
        description: '¿Esta Activo?',
        maxWidth: '0.4fr',
        minWidth: '100px',
        cell: ({ value }) => {
          const isActive = value?.active;
          return (
            <StatusPill $active={isActive}>
              {value?.label ?? (isActive ? 'Activo' : 'Inactivo')}
            </StatusPill>
          );
        },
      },
      {
        Header: 'Conexion',
        accessor: 'presence',
        align: 'left',
        maxWidth: '0.3fr',
        minWidth: '110px',
        cell: ({ value }) => {
          const isOnline = value?.state === 'online';
          const lastUpdated = value?.lastUpdated;
          let label = isOnline ? 'En linea' : 'Sin datos';
          if (!isOnline && lastUpdated) {
            const date = DateTime.fromMillis(lastUpdated);
            const diffHours = DateTime.now().diff(date, 'hours').hours;
            label =
              diffHours < 24
                ? date.toRelative({ style: 'short' }) || 'Reciente'
                : date.toFormat('dd/LL/yyyy');
          }
          return (
            <PresenceBadge
              $online={isOnline}
              title={isOnline ? 'En linea' : `Fuera de linea · ${label}`}
            >
              <FontAwesomeIcon icon={faCircle} className="presence-dot" />
              <span>{label}</span>
            </PresenceBadge>
          );
        },
      },
    ];

    if (abilities.can('manage', 'User')) {
      baseColumns.push({
        Header: '',
        accessor: 'user',
        align: 'center',
        maxWidth: '0.2fr',
        minWidth: '50px',
        fixed: 'right',
        cell: ({ value }) => (
          <ActionMenu
            user={value}
            onEdit={handleEditUser}
            onChangePassword={openPasswordModal}
            onToggleStatus={openStatusModal}
            onManagePermissions={openPermissionsModal}
            onViewActivity={handleViewActivity}
            canManageDynamicPermissions={canManageDynamicPermissions}
          />
        ),
      });
    }

    return baseColumns;
  }, [
    abilities,
    canManageDynamicPermissions,
    handleEditUser,
    handleViewActivity,
    openPasswordModal,
    openPermissionsModal,
    openStatusModal,
  ]);

  // Solo mostrar la tabla si tiene permisos para ver usuarios (o si está cargando)
  if (
    !permissionsLoading &&
    !abilities.can('read', 'User') &&
    !abilities.can('manage', 'User')
  ) {
    return <div>No tienes permisos para ver la lista de usuarios.</div>;
  }

  return (
    <>
      <AdvancedTable
        tableName={'Usuarios'}
        data={sortedData}
        columns={columns}
        pagination={true}
        searchTerm={searchTerm}
        headerComponent={
          <SearchBar>
            <Input
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar usuarios..."
            />
          </SearchBar>
        }
        onRowClick={
          abilities.can('manage', 'User')
            ? (row) => handleEditUser(row.user)
            : undefined
        }
        loading={loading || permissionsLoading}
        rowBorder={true}
      />

      <ChangeUserPasswordModal
        isOpen={isPasswordModalOpen}
        user={selectedUser}
        onClose={closePasswordModal}
      />

      <ToggleUserStatusModal
        isOpen={isStatusModalOpen}
        user={selectedUser}
        onClose={closeStatusModal}
      />

      {canManageDynamicPermissions && (
        <DynamicPermissionsManager
          userId={selectedUser?.id}
          userName={
            selectedUser?.name ||
            selectedUser?.realName ||
            selectedUser?.username
          }
          userRole={selectedUser?.role}
          isOpen={isPermissionsModalOpen}
          onClose={closePermissionsModal}
        />
      )}
    </>
  );
};

const ActionMenu = ({
  user,
  onEdit,
  onChangePassword,
  onToggleStatus,
  onManagePermissions,
  onViewActivity,
  canManageDynamicPermissions,
}) => {
  const isActive = Boolean(user?.active);

  const hasDynamicPermissions = useMemo(
    () => getAvailablePermissionsForRole(user?.role)?.length > 0,
    [user?.role],
  );

  const items = useMemo(() => {
    const menuItems = [];

    menuItems.push({
      key: 'activity',
      icon: <FieldTimeOutlined />,
      label: 'Ver actividad',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onViewActivity?.(user);
      },
    });

    menuItems.push({
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Editar usuario',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onEdit?.(user);
      },
    });

    if (canManageDynamicPermissions && hasDynamicPermissions) {
      menuItems.push({
        key: 'permissions',
        icon: <SettingOutlined />,
        label: 'Permisos dinámicos',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          onManagePermissions?.(user);
        },
      });
    }

    menuItems.push({
      key: 'password',
      icon: <KeyOutlined />,
      label: 'Cambiar contraseña',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onChangePassword?.(user);
      },
    });

    menuItems.push({
      key: 'toggle',
      icon: isActive ? <StopOutlined /> : <CheckCircleOutlined />,
      label: isActive ? 'Desactivar usuario' : 'Activar usuario',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onToggleStatus?.(user);
      },
    });

    return menuItems;
  }, [
    canManageDynamicPermissions,
    hasDynamicPermissions,
    isActive,
    onChangePassword,
    onEdit,
    onManagePermissions,
    onViewActivity,
    onToggleStatus,
    user,
  ]);

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <ActionButton
        type="text"
        shape="circle"
        icon={<MoreOutlined />}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label="Acciones"
      />
    </Dropdown>
  );
};

const SearchBar = styled.div`
  padding: 0.5em 1em;
  background-color: ${(props) => props.theme.bg.primary};
  border-bottom: var(--border-primary);

    & .ant-input-affix-wrapper,
  & .ant-input {
    width: 100%;
    max-width: 320px;
  }
`;

const ActionButton = styled(Button)`
  color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
`;

export default UserList;
