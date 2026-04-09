import { faCircle, faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import { getRoleLabelById, userRoles } from '@/abilities/roles';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

import type {
  AbilityLike,
  PresenceStatus,
  TimestampLike,
  UserListRow,
  UserProfile,
  UserRoleLike,
} from '../types';
import { toMillis } from '../utils/userList';
import { UserListActionMenu } from './UserListActionMenu';

interface RoleBadgeProps {
  $primaryColor: string;
  $secondaryColor: string;
}

const Role = styled.div<RoleBadgeProps>`
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

const OwnerCrown = styled.span`
  display: inline-flex;
  align-items: center;
  color: #d97706;
  font-size: 0.85rem;
  filter: drop-shadow(0 1px 1px rgb(217 119 6 / 25%));
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

interface StatusPillProps {
  $active?: boolean;
}

const StatusPill = styled.span<StatusPillProps>`
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

interface PresenceBadgeProps {
  $online?: boolean;
}

const PresenceBadge = styled.span<PresenceBadgeProps>`
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
    ${({ $online }) =>
      $online ? 'rgba(13, 104, 50, 0.28)' : 'rgba(148, 163, 184, 0.25)'};
  border-radius: 12px;

  .presence-dot {
    font-size: 0.65rem;
    color: ${({ $online }) => ($online ? '#1DB954' : '#94A3B8')};
    filter: drop-shadow(
      ${({ $online }) => ($online ? '0 0 4px rgba(29, 185, 84, 0.5)' : 'none')}
    );
  }
`;

interface CreateUserListColumnsArgs {
  abilities: AbilityLike;
  canManageDynamicPermissions: boolean;
  currentActorUserId: string | null;
  onChangePassword: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onManagePermissions: (user: UserProfile) => void;
  onToggleStatus: (user: UserProfile) => void;
  onViewActivity: (user: UserProfile) => void;
}

export const createUserListColumns = ({
  abilities,
  canManageDynamicPermissions,
  currentActorUserId,
  onChangePassword,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onViewActivity,
}: CreateUserListColumnsArgs): AdvancedTableProps<UserListRow>['columns'] => {
  const baseColumns: NonNullable<AdvancedTableProps<UserListRow>['columns']> = [
    {
      Header: '#',
      accessor: 'number',
      align: 'left',
      maxWidth: '0.2fr',
      minWidth: '60px',
      cell: ({ value }: { value: unknown }) => {
        const indexValue = typeof value === 'number' ? value : undefined;
        return <IndexBadge>{indexValue ?? '--'}</IndexBadge>;
      },
    },
    {
      Header: 'Nombre',
      accessor: 'name',
      align: 'left',
      maxWidth: '1fr',
      minWidth: '150px',
      cell: ({ value, row }: { value: unknown; row?: UserListRow }) => {
        const nameValue = value as UserListRow['name'] | undefined;
        const isBusinessOwner = Boolean(row?.isBusinessOwner);
        return (
          <NameCell>
            <NameContent>
              <span className="name">
                {isBusinessOwner && (
                  <OwnerCrown title="Propietario del negocio">
                    <FontAwesomeIcon icon={faCrown} />
                  </OwnerCrown>
                )}
                {' '}
                {nameValue?.displayName ?? 'Usuario sin nombre'}
              </span>
              {nameValue?.email && <span className="meta">{nameValue.email}</span>}
            </NameContent>
          </NameCell>
        );
      },
    },
    {
      Header: 'Fecha de Creación',
      accessor: 'createAt',
      align: 'left',
      maxWidth: '0.8fr',
      cell: ({ value }: { value: unknown }) => {
        const millis = toMillis(value as TimestampLike);
        if (typeof millis !== 'number') {
          return <span>Sin registro</span>;
        }

        const dateObject = DateTime.fromMillis(millis);
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
      cell: ({ value }: { value: unknown }) => {
        const roleValue = normalizeRoleId(value as UserRoleLike | undefined);
        const role = userRoles.find((item) => item.id === roleValue);
        const primaryColor = role?.primaryColor ?? '#475467';
        const secondaryColor =
          role?.secondaryColor ?? 'rgba(148, 163, 184, 0.18)';

        return (
          <Role
            $primaryColor={primaryColor}
            $secondaryColor={secondaryColor}
          >
            {getRoleLabelById(roleValue)}
          </Role>
        );
      },
    },
    {
      Header: 'Estado',
      accessor: 'status',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '100px',
      cell: ({ value }: { value: unknown }) => {
        const statusValue = value as UserListRow['status'] | undefined;
        const isActive = statusValue?.active;
        return (
          <StatusPill $active={isActive}>
            {statusValue?.label ?? (isActive ? 'Activo' : 'Inactivo')}
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
      cell: ({ value }: { value: unknown }) => {
        const presenceValue = (value as PresenceStatus) ?? {
          state: 'offline',
          lastUpdated: null,
        };
        const isOnline = presenceValue?.state === 'online';
        const lastUpdated = presenceValue?.lastUpdated;
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
      cell: ({ value }: { value: unknown }) => (
        <UserListActionMenu
          user={value as UserProfile | undefined}
          onEdit={onEdit}
          onChangePassword={onChangePassword}
          onToggleStatus={onToggleStatus}
          onManagePermissions={onManagePermissions}
          onViewActivity={onViewActivity}
          canManageDynamicPermissions={canManageDynamicPermissions}
          currentActorUserId={currentActorUserId}
        />
      ),
    });
  }

  return baseColumns;
};
