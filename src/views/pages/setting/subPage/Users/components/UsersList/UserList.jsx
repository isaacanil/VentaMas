import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { getRoleLabelById, userRoles } from '../../../../../../../abilities/roles'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { toggleSignUpUser } from '../../../../../../../features/modals/modalSlice'
import { updateUser } from '../../../../../../../features/usersManagement/usersManagementSlice'
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'

const columns = [
  {
    Header: '#',
    accessor: 'number',
    align: 'left',
    description: 'número',
    maxWidth: '0.2fr',
    minWidth: '60px',
  },
  {
    Header: 'Nombre',
    accessor: 'name',
    align: 'left',
    maxWidth: '1fr',
    minWidth: '150px',
  },
  {
    Header: 'Fecha de Creación',
    accessor: 'createAt',
    align: 'left',
    cell: ({ value }) => {
      const millis = value?.seconds * 1000;
      const dateObject = DateTime.fromMillis(millis);
      return dateObject.toLocaleString(DateTime.DATETIME_MED);
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
  },
]

export const UserList = () => {
  const [users, setUsers] = useState([])
  const currentUser = useSelector(selectUser)
  const dispatch = useDispatch();
  const { abilities } = userAccess()
  
  useEffect(() => {
    fbGetUsers(currentUser, setUsers)
  }, [currentUser])
  
  const data = users.map(({ user }, index) => {
    return {
      number: user.number,
      name: user.name,
      createAt: user.createAt,
      role: user.role,
      active: user.active ? "Activo" : "inactivo",
      user: user
    }
  })
  
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
      onRowClick={abilities.can('manage', 'User') ? (row) => handleEditUser(row.user) : undefined}
    />
  )
}




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