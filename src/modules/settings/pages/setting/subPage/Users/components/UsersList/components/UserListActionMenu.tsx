import {
  CheckCircleOutlined,
  EditOutlined,
  FieldTimeOutlined,
  KeyOutlined,
  MoreOutlined,
  SettingOutlined,
  StopOutlined,
} from '@/constants/icons/antd';
import { Button, Dropdown, type MenuProps } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { getAvailablePermissionsForRole } from '@/services/dynamicPermissions';

import type { UserProfile } from '../types';
import { toCleanString } from '../utils/userList';

interface UserListActionMenuProps {
  user?: UserProfile;
  onEdit?: (user: UserProfile) => void;
  onChangePassword?: (user: UserProfile) => void;
  onToggleStatus?: (user: UserProfile) => void;
  onManagePermissions?: (user: UserProfile) => void;
  onViewActivity?: (user: UserProfile) => void;
  canManageDynamicPermissions: boolean;
  currentActorUserId?: string | null;
}

export const UserListActionMenu = ({
  user,
  onEdit,
  onChangePassword,
  onToggleStatus,
  onManagePermissions,
  onViewActivity,
  canManageDynamicPermissions,
  currentActorUserId,
}: UserListActionMenuProps) => {
  const isActive = Boolean(user?.active);
  const isBusinessOwner = Boolean(user?.isBusinessOwner);
  const currentUserId = toCleanString(currentActorUserId);
  const targetUserId = toCleanString(user?.uid || user?.id || null);
  const isSelfTarget = Boolean(
    currentUserId && targetUserId && currentUserId === targetUserId,
  );
  const canToggleStatus = !isSelfTarget && !isBusinessOwner;

  const hasDynamicPermissions = useMemo(
    () => getAvailablePermissionsForRole(user?.role)?.length > 0,
    [user?.role],
  );

  const items = useMemo<MenuProps['items']>(() => {
    const menuItems: NonNullable<MenuProps['items']> = [];

    menuItems.push({
      key: 'activity',
      icon: <FieldTimeOutlined />,
      label: 'Ver actividad',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        if (user) {
          onViewActivity?.(user);
        }
      },
    });

    menuItems.push({
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Editar usuario',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        if (user) {
          onEdit?.(user);
        }
      },
    });

    if (canManageDynamicPermissions && hasDynamicPermissions) {
      menuItems.push({
        key: 'permissions',
        icon: <SettingOutlined />,
        label: 'Permisos dinámicos',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation();
          if (user) {
            onManagePermissions?.(user);
          }
        },
      });
    }

    menuItems.push({
      key: 'password',
      icon: <KeyOutlined />,
      label: 'Cambiar contraseña',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        if (user) {
          onChangePassword?.(user);
        }
      },
    });

    menuItems.push({
      key: 'toggle',
      icon: isActive ? <StopOutlined /> : <CheckCircleOutlined />,
      label: isSelfTarget
        ? 'No puedes desactivarte'
        : isBusinessOwner
          ? 'No se puede desactivar al dueño'
          : isActive
            ? 'Desactivar usuario'
            : 'Activar usuario',
      disabled: !canToggleStatus,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        if (!canToggleStatus) return;
        if (user) {
          onToggleStatus?.(user);
        }
      },
    });

    return menuItems;
  }, [
    canManageDynamicPermissions,
    canToggleStatus,
    hasDynamicPermissions,
    isActive,
    isBusinessOwner,
    isSelfTarget,
    onChangePassword,
    onEdit,
    onManagePermissions,
    onToggleStatus,
    onViewActivity,
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

const ActionButton = styled(Button)`
  color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
`;
