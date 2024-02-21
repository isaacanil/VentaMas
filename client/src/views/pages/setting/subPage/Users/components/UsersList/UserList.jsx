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

const renamedAbilities = (abilities) => {
  switch (abilities) {
    case 'owner':
      return 'Dueño'
    case 'admin':
      return 'Admin'
    case 'buyer':
      return 'Compras'
    case 'cashier':
      return 'Cajero'
    case 'manager':
      return 'Gerente'
    case 'dev':
      return 'Desarrollador'
  }
}
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
    cell: ({ value }) => (
      <Role role={value}>
        {renamedAbilities(value)}
      </Role>
    ),

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
    navigate('/users/update-user/' + user.id)
  }
 
  return (
    <Container>
      <TableWrapper>
        <AdvancedTable
          tableName={'Usuarios'}
          data={data}
          columns={columns}
          onRowClick={(row) => handleEditUser(row.user)}
        />
      </TableWrapper>
    </Container>
  )
}


const Container = styled.div`
height: 100%;
background-color: var(--color2);
display: grid;
grid-template-rows: 1fr;
padding: 1em;
`
const TableWrapper = styled.div`
height: 100%;
`
const Role = styled.div`
    height: 2em;
    max-width: 150px;
    border-radius: 100px;
    width: 100%;
  display: flex;
  text-transform: capitalize;
  align-items: center;
  padding: 0 1em;
 color: ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#0072F5`
      case 'admin':
        return `#9750DD;`
      case 'buyer':
        return `#17C964;`
      case 'cashier':
        return `#F5A524;`
      case 'manager':
        return `#F31260;`
      case 'dev':
        return `#f312bb;`
      default:
    }
  }};
    border: 2px solid ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#0072F5`
      case 'admin':
        return `#9750DD;`
      case 'buyer':
        return `#17C964;`
      case 'cashier':
        return `#F5A524;`
      case 'manager':
        return `#F31260;`
      case 'dev':
        return `#f312bb;`
      default:
    }
  }};
  font-weight: 600;
    background-color: ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#e4f1ff`
      case 'admin':
        return `#f5ebff;`
      case 'buyer':
        return `#e3ffef;`
      case 'cashier':
        return `#fff8ec;`
      case 'manager':
        return `#ffe3ec;`
      case 'dev':
        return `#ffe9fb;`
      default:
    }
  }};
      `