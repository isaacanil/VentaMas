import { Input } from 'antd';
import { DateTime } from 'luxon'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { getRoleLabelById, userRoles } from '../../../../../../../abilities/roles'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { toggleSignUpUser } from '../../../../../../../features/modals/modalSlice'
import { updateUser } from '../../../../../../../features/usersManagement/usersManagementSlice'
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'

const Role = styled.div`
  height: 2em;
  border-radius: 100px;
  width: fit-content;
  display: flex;
  text-transform: capitalize;
  align-items: center;
  padding: 0 1em;
  color: ${props => props.primaryColor};
  background-color: ${props => props.secondaryColor};
  border: 2px solid ${props => props.primaryColor};
  font-weight: 600;
`

const IndexBadge = styled.div`
  width: 2.5em;
  height: 2.5em;
  display: grid;
  place-items: center;
  font-weight: 600;
  border-radius: 12px;
  background: ${({ theme }) => (theme?.bg?.tertiary ?? 'rgba(15, 23, 42, 0.08)')};
  color: ${({ theme }) => (theme?.text?.secondary ?? '#344054')};
  border: 1px solid ${({ theme }) => (theme?.border?.primary ?? 'rgba(15, 23, 42, 0.08)')};
`

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75em;
`

const AvatarBubble = styled.div`
  width: 2.75em;
  height: 2.75em;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: ${({ theme }) => (theme?.bg?.secondary ?? 'rgba(59, 130, 246, 0.12)')};
  color: ${({ theme }) => (theme?.text?.primary ?? '#1F2937')};
  border: 1px solid ${({ theme }) => (theme?.border?.primary ?? 'rgba(59, 130, 246, 0.35)')};
`

const NameContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15em;

  .name {
    font-weight: 500;
    color: ${({ theme }) => (theme?.text?.primary ?? '#111827')};
  }

  .meta {
    font-size: 0.75rem;
    color: ${({ theme }) => (theme?.text?.secondary ?? '#6B7280')};
  }
`

const DateCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15em;

  .date {
    font-weight: 500;
    color: ${({ theme }) => (theme?.text?.primary ?? '#111827')};
  }
`

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35em 0.9em;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#0F5132' : '#4F6275')};
  background: ${({ $active }) => ($active ? 'rgba(25, 135, 84, 0.12)' : 'rgba(148, 163, 184, 0.18)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(25, 135, 84, 0.35)' : 'rgba(148, 163, 184, 0.35)')};
  text-transform: capitalize;
`

const getInitials = (value = '') => {
  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return initials || 'US'
}

const columns = [
  {
    Header: '#',
    accessor: 'number',
    align: 'left',
    maxWidth: '0.2fr',
    minWidth: '60px',
    cell: ({ value }) => (
      <IndexBadge>
        {value ?? '--'}
      </IndexBadge>
    ),
  },
  {
    Header: 'Nombre',
    accessor: 'name',
    align: 'left',
    maxWidth: '1fr',
    minWidth: '150px',
    cell: ({ value, row }) => {
      const user = row?.original?.user ?? {}
      const email = user.email || user.username

      return (
        <NameCell>
          <NameContent>
            <span className="name">{value || 'Usuario sin nombre'}</span>
            {email && <span className="meta">{email}</span>}
          </NameContent>
        </NameCell>
      )
    },
  },
  {
    Header: 'Fecha de Creación',
    accessor: 'createAt',
    align: 'left',
    maxWidth: '0.8fr',
    cell: ({ value }) => {
      if (!value?.seconds) {
        return <span>Sin registro</span>
      }

      const dateObject = DateTime.fromSeconds(value.seconds);

      return (
        <DateCell>
          <span className="date">{dateObject.toLocaleString(DateTime.DATE_SHORT)}</span>
        </DateCell>
      );
    },
  },
  {
    Header: 'Rol',
    accessor: 'role',
    align: 'left',
    cell: ({ value }) => {
      const role = userRoles.find(r => r.id === value) || {};

      return (
        <Role
          primaryColor={role.primaryColor}
          secondaryColor={role.secondaryColor}
        >
          {getRoleLabelById(value)}
        </Role>
      )
    },
  },
  {
    Header: 'Estado',
    accessor: 'active',
    align: 'left',
    description: '¿Esta Activo?',
    maxWidth: '0.4fr',
    minWidth: '100px',
    cell: ({ value }) => (
      <StatusPill $active={value === 'Activo'}>
        {value}
      </StatusPill>
    ),
  },
]

export const UserList = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = useSelector(selectUser)
  const dispatch = useDispatch();
  const { abilities } = userAccess()
  
  useEffect(() => {
    fbGetUsers(currentUser, setUsers)
  }, [currentUser])
  
  const data = useMemo(() => users.map(({ user }) => ({
      number: user.number,
      name: user.name,
      createAt: user.createAt,
      role: user.role,
      active: user.active ? "Activo" : "Inactivo",
      user: user
    })), [users]);
  
  const handleEditUser = (user) => {
    // Solo permitir editar si tiene permisos
    if (abilities.can('manage', 'User')) {
      dispatch(updateUser(user))
      dispatch(toggleSignUpUser({ isOpen: true, data: user }))
    }
  }

  // Solo mostrar la tabla si tiene permisos para ver usuarios
  if (!abilities.can('read', 'User') && !abilities.can('manage', 'User')) {
    return <div>No tienes permisos para ver la lista de usuarios.</div>
  }

  return (
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
      onRowClick={abilities.can('manage', 'User') ? (row) => handleEditUser(row.user) : undefined}
    />
  )
}




const SearchBar = styled.div`
  padding: 0.5em 1em;
  background-color: ${props => props.theme.bg.primary};
  border-bottom: var(--border-primary);

  & .ant-input-affix-wrapper,
  & .ant-input {
    width: 100%;
    max-width: 320px;
  }
`;

export default UserList;
