import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Table } from '../../../../../../templates/system/Table/Table'
import { Footer } from '../../../../../../templates/system/Table/Footer'
import { Body } from './Table/Body'
import { Header } from './Table/Header'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers'
import { Item } from './Table/Item/Item'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../../../../../../../features/usersManagement/usersManagementSlice'
import { DateTime } from 'luxon'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'
import { getRoleLabelById, userRoles } from '../../../../../../../abilities/roles'
import { toggleSignUpUser } from '../../../../../../../features/modals/modalSlice'

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
  const userActual = useSelector(selectUser)
  const { abilities } = userAccess();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    fbGetUsers(setUsers, userActual)
  }, [userActual])
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
    dispatch(updateUser(user))
    dispatch(toggleSignUpUser({ isOpen: true, data: user }))
    // navigate('/users/update-user/' + user.id)
  }

  return (
   
 
        <AdvancedTable
          tableName={'Usuarios'}
          data={data}
          columns={columns}
          pagination={true}
          onRowClick={(row) => handleEditUser(row.user)}
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