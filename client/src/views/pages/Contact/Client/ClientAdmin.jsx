import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  MenuApp,
  Button,
} from '../../../'


import { filterData} from '../../../../hooks/search/useSearch'
import { ClientsListTable } from './components/OrderListTable/ClientsListTable'
import { ToolBar } from './ToolBar'
import { useFbGetClients } from '../../../../firebase/client/useFbGetClients'
export const ClientAdmin = () => { 
  const [searchTerm, setSearchTerm] = useState('')
  const {clients} = useFbGetClients()
  const clientsFiltered = filterData(clients, searchTerm)
  return (
    <Fragment>
      <MenuApp
        sectionName='Clientes' 
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
  
      <Container>
        <ClientsListTable clients={clientsFiltered}/>
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
    width: 100vw;
    height: calc(100vh - 2.75em);
    background-color: var(--color2);
    display: grid;

    overflow: hidden;
`