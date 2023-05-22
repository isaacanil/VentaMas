import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Table } from '../../../../../../templates/system/Table/Table'
import { Footer } from '../../../../../../templates/system/Table/Footer'
import { Body } from './Body'
import { Header } from './Header'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers'
import { Item } from './Item'

const tableConfig = {
  headers: [
    {
      name: '#',
      align: 'left',
      description: 'número',
      max: '1fr',
      min: '150px',
    },
    {
      name: 'Nombre',
      align: 'left',
      description: 'Nombre del usuario',
      max: '1fr',
      min: '150px',
    },
    {
      name: 'Rol',
      align: 'left',
      description: 'Rol',
      max: '1fr',
      min: '150px',
    },
    {
      name: 'Estado',
      align: 'left',
      description: '¿Esta Activo?',
      max: '1fr',
      min: '150px',
    },
    {
      name: '',
      align: 'right',
      description: '¿Esta Activo?',
      max: '1fr',
      min: '150px',
    }
  ]
}

export const UserList = () => {
  const [users, setUsers] = useState([])
  const userActual = useSelector(selectUser)

  useEffect(() => {
    fbGetUsers(setUsers, userActual)
  }, [userActual])

  return (
    <Container>
      <Table
        colWidth={tableConfig.headers}
        header={<Header data={tableConfig.headers} />}
        body={
          <Body
            data={users}
            Item={Item}
            colWidth={tableConfig.headers}
          />
        }
      />
    </Container>
  )
}


const Container = styled.div`
height: 100%;
background-color: var(--color2);
display: grid;
grid-template-rows: 1fr;
`