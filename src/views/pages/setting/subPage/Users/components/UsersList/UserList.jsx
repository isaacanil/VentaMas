import {
  CheckCircleOutlined,
  EditOutlined,
  KeyOutlined,
  MoreOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input } from 'antd';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  getRoleLabelById,
  userRoles,
} from '../../../../../../../abilities/roles';
import { selectUser } from '../../../../../../../features/auth/userSlice';
import { toggleSignUpUser } from '../../../../../../../features/modals/modalSlice';
import { updateUser } from '../../../../../../../features/usersManagement/usersManagementSlice';
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers';
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities';
import { getAvailablePermissionsForRole } from '../../../../../../../services/dynamicPermissions';
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable';
import DynamicPermissionsManager from '../DynamicPermissionsManager';

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
  color: ${(props) => props.primaryColor};
  text-transform: capitalize;
  background-color: ${(props) => props.secondaryColor};
  border: 1px solid ${(props) => props.primaryColor};
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

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const currentUser = useSelector(selectUser);
  const dispatch = useDispatch();
  const { abilities, loading: permissionsLoading } = userAccess();
  const canManageDynamicPermissions = abilities.can('manage', 'users');

  useEffect(() => {
    setLoading(true);
    fbGetUsers(currentUser, setUsers, null, () => setLoading(false));
  }, [currentUser]);

  const data = useMemo(
    () =>
      users.map(({ user }) => {
        const name = user?.name || 'Usuario sin nombre';
        const email = user?.email || user?.username || '';
        const isActive = Boolean(user?.active);
        const statusLabel = isActive ? 'Activo' : 'Inactivo';

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
          user,
          searchText:
            `${name} ${email} ${statusLabel} ${getRoleLabelById(user?.role) ?? ''}`.toLowerCase(),
        };
      }),
    [users],
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
              primaryColor={role.primaryColor}
              secondaryColor={role.secondaryColor}
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
        data={data}
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
  canManageDynamicPermissions,
}) => {
  const isActive = Boolean(user?.active);

  const hasDynamicPermissions = useMemo(
    () => getAvailablePermissionsForRole(user?.role)?.length > 0,
    [user?.role],
  );

  const items = useMemo(() => {
    const menuItems = [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Editar usuario',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          onEdit?.(user);
        },
      },
      {
        key: 'password',
        icon: <KeyOutlined />,
        label: 'Cambiar contraseña',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          onChangePassword?.(user);
        },
      },
      {
        key: 'toggle',
        icon: isActive ? <StopOutlined /> : <CheckCircleOutlined />,
        label: isActive ? 'Desactivar usuario' : 'Activar usuario',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          onToggleStatus?.(user);
        },
      },
    ];

    if (canManageDynamicPermissions && hasDynamicPermissions) {
      menuItems.splice(1, 0, {
        key: 'permissions',
        icon: <SettingOutlined />,
        label: 'Permisos dinámicos',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          onManagePermissions?.(user);
        },
      });
    }

    return menuItems;
  }, [
    canManageDynamicPermissions,
    hasDynamicPermissions,
    isActive,
    onChangePassword,
    onEdit,
    onManagePermissions,
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
