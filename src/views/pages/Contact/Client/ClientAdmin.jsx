import React, { Fragment, useState } from 'react'
import styled from 'styled-components'

import { useFbGetClients } from '../../../../firebase/client/useFbGetClients'
import { filterData } from '../../../../hooks/search/useSearch'
import { MenuApp } from '../../../templates/MenuApp/MenuApp';


import { ClientsListTable } from './components/OrderListTable/ClientsListTable'

export const ClientAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { clients } = useFbGetClients()
  const clientsFiltered = filterData(clients, searchTerm)
  return (
    <Fragment>
      <MenuApp
        sectionName='Clientes'
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        <ClientsListTable clients={clientsFiltered} />
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