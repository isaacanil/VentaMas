import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Table } from '../../../../../../templates/system/Table/Table'
import { Footer } from '../../../../../../templates/system/Table/Footer'
import { Body } from './Table/Body'
import { Header } from './Table/Header'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { fbGetUsers } from '../../../../../../../firebase/users/fbGetUsers'
import { Item } from './Table/Item/Item'
import { inspectUserAccess } from '../../../../../../../hooks/abilities/useAbilities'

const tableConfig = {
  headers: [
    {
      name: '#',
      align: 'left',
      description: 'número',
      max: '0.2fr',
      min: '60px',
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
      max: '0.4fr',
      min: '90px',
    },
    {
      name: 'Estado',
      align: 'left',
      description: '¿Esta Activo?',
      max: '0.4fr',
      min: '100px',
    },

  ]
}

export const UserList = () => {
  const [users, setUsers] = useState([])
  const userActual = useSelector(selectUser)
  const { abilities } = inspectUserAccess();

  useEffect(() => {
    fbGetUsers(setUsers, userActual)
  }, [userActual])

  return (
    <Container>
      <Table
        colWidth={tableConfig.headers}
        header={<Header data={tableConfig.headers} />}
        body={
          abilities.can("read", "User") && (
            <Body
              data={users}
              Item={Item}
              colWidth={tableConfig.headers}
            />
          )
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