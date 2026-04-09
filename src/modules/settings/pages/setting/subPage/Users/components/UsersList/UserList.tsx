import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar/FilterBar';
import { selectUser } from '@/features/auth/userSlice';
import { toggleSignUpUser } from '@/features/modals/modalSlice';
import { updateUser } from '@/features/usersManagement/usersManagementSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import DynamicPermissionsManager from '@/modules/settings/pages/setting/subPage/Users/components/DynamicPermissionsManager/DynamicPermissionsManager';
import ROUTES_NAME from '@/router/routes/routesName';

import { ChangeUserPasswordModal } from './ChangeUserPasswordModal';
import { ToggleUserStatusModal } from './ToggleUserStatusModal';
import { useUserListData } from './hooks/useUserListData';
import { useUserListUiState } from './hooks/useUserListUiState';
import type { AbilityLike, UserListRow, UserProfile } from './types';
import {
  buildUserListRows,
  buildUserSearchFilterItem,
  filterUserListRows,
  PRESENCE_FILTER_OPTIONS,
  resolveCurrentBusinessId,
  ROLE_FILTER_OPTIONS,
  sortUserListRows,
  STATUS_FILTER_OPTIONS,
} from './utils/userList';
import { createUserListColumns } from './utils/userListTable';

const {
  SETTING_TERM: { USERS, USERS_ACTIVITY_DETAIL },
} = ROUTES_NAME;

export const UserList = () => {
  const currentUser = useSelector(selectUser) as UserProfile | null;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { abilities, loading: permissionsLoading } = useUserAccess() as {
    abilities: AbilityLike;
    loading: boolean;
  };
  const canManageDynamicPermissions = abilities.can('manage', 'users');
  const activeBusinessId = resolveCurrentBusinessId(currentUser);
  const {
    clearFilters,
    closeActiveModal,
    filters,
    isPasswordModalOpen,
    isPermissionsModalOpen,
    isStatusModalOpen,
    openPasswordModal,
    openPermissionsModal,
    openStatusModal,
    searchTerm,
    selectedUser,
    setFilterValue,
    setSearchTerm,
  } = useUserListUiState();
  const {
    businessOwnerCandidates,
    isUsersLoading,
    presenceMap,
    presenceMapForUsers,
    users,
  } = useUserListData(activeBusinessId);
  const businessOwnerCandidateSet = useMemo(
    () => new Set(businessOwnerCandidates),
    [businessOwnerCandidates],
  );
  const data = useMemo(
    () =>
      buildUserListRows({
        businessOwnerCandidateSet,
        presenceMapForUsers,
        users,
      }),
    [businessOwnerCandidateSet, presenceMapForUsers, users],
  );
  const filteredData = useMemo(
    () => filterUserListRows(data, filters),
    [data, filters],
  );
  const sortedData = useMemo(
    () => sortUserListRows(filteredData),
    [filteredData],
  );

  const handleViewActivity = useCallback(
    (user: UserProfile) => {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      navigate(
        `${USERS}/${USERS_ACTIVITY_DETAIL.replace(
          ':userId',
          encodeURIComponent(userId),
        )}`,
        {
          state: {
            user,
            presence: presenceMap[userId],
          },
        },
      );
    },
    [navigate, presenceMap],
  );

  const handleEditUser = useCallback(
    (user: UserProfile) => {
      if (!abilities.can('manage', 'User')) return;

      dispatch(updateUser(user));
      dispatch(
        toggleSignUpUser({
          isOpen: true,
          data: user,
          businessID: user?.businessID,
        }),
      );
    },
    [abilities, dispatch],
  );

  const handleOpenPermissionsModal = useCallback(
    (user: UserProfile) => {
      if (!canManageDynamicPermissions) return;
      openPermissionsModal(user);
    },
    [canManageDynamicPermissions, openPermissionsModal],
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters],
  );
  const filterItems = useMemo(
    () => [
      buildUserSearchFilterItem({
        searchTerm,
        onChange: setSearchTerm,
      }),
      {
        key: 'role',
        section: 'main' as const,
        label: 'Rol',
        type: 'select' as const,
        value: filters.role || undefined,
        onChange: setFilterValue('role'),
        options: ROLE_FILTER_OPTIONS,
        placeholder: 'Todos los roles',
        width: 150,
      },
      {
        key: 'status',
        section: 'main' as const,
        label: 'Estado',
        type: 'select' as const,
        value: filters.status || undefined,
        onChange: setFilterValue('status'),
        options: STATUS_FILTER_OPTIONS,
        placeholder: 'Todos',
        width: 130,
      },
      {
        key: 'presence',
        section: 'main' as const,
        label: 'Conexión',
        type: 'select' as const,
        value: filters.presence || undefined,
        onChange: setFilterValue('presence'),
        options: PRESENCE_FILTER_OPTIONS,
        placeholder: 'Todos',
        width: 150,
      },
    ],
    [filters, searchTerm, setFilterValue, setSearchTerm],
  );
  const columns = useMemo(
    () =>
      createUserListColumns({
        abilities,
        canManageDynamicPermissions,
        currentActorUserId: currentUser?.uid || currentUser?.id || null,
        onChangePassword: openPasswordModal,
        onEdit: handleEditUser,
        onManagePermissions: handleOpenPermissionsModal,
        onToggleStatus: openStatusModal,
        onViewActivity: handleViewActivity,
      }),
    [
      abilities,
      canManageDynamicPermissions,
      currentUser?.id,
      currentUser?.uid,
      handleEditUser,
      handleOpenPermissionsModal,
      handleViewActivity,
      openPasswordModal,
      openStatusModal,
    ],
  );

  if (
    !permissionsLoading &&
    !abilities.can('read', 'User') &&
    !abilities.can('manage', 'User')
  ) {
    return <div>No tienes permisos para ver la lista de usuarios.</div>;
  }

  return (
    <>
      <AdvancedTable<UserListRow>
        tableName="Usuarios"
        data={activeBusinessId ? sortedData : []}
        columns={columns}
        showPagination={true}
        searchTerm={searchTerm}
        headerComponent={
          <CommonFilterBar
            items={filterItems}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            labels={{
              drawerTrigger: 'Filtros',
              drawerTitle: 'Filtros de usuarios',
              clear: 'Limpiar',
            }}
          />
        }
        onRowClick={
          abilities.can('manage', 'User')
            ? (row: UserListRow) => row.user && handleEditUser(row.user)
            : undefined
        }
        getRowId={(row) => row.id}
        loading={isUsersLoading || permissionsLoading}
        rowBorder={true}
      />

      <ChangeUserPasswordModal
        isOpen={isPasswordModalOpen}
        user={selectedUser}
        onClose={closeActiveModal}
      />

      <ToggleUserStatusModal
        isOpen={isStatusModalOpen}
        user={selectedUser}
        onClose={closeActiveModal}
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
          onClose={closeActiveModal}
        />
      )}
    </>
  );
};

export default UserList;
