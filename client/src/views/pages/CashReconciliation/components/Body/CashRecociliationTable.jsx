import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Table } from '../../../../templates/system/Table/Table'
import { tableConfig } from './tableConfig'
import { Header } from '../../../setting/subPage/Users/components/UsersList/Table/Header'
import { Body } from '../../../setting/subPage/Users/components/UsersList/Table/Body'
import { Item } from './Item'
import { SettingsControlBar } from '../SettingsControlBar'
import { fbGetCashCounts } from '../../../../../firebase/cashCount/fbGetCashCounts'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'

export const CashReconciliationTable = () => {
  const [cashCount, setCashCount] = useState(0)
  const user = useSelector(selectUser)
  useEffect(()=>{
    fbGetCashCounts(user, setCashCount)
  },[user])
  console.log(cashCount)
    return (
        <Container>
            <SettingsControlBar />
            <Table  
                 colWidth={tableConfig.headers}
                 header={<Header data={tableConfig.headers} />}
                 body={
                   <Body
                     Item={Item}
                     colWidth={tableConfig.headers}
                      data={cashCount}
                      
                   />
                 }
            />
        </Container>
    )
}

const Container = styled.div`
  display: grid;
  padding: 0.4em;
  grid-template-rows: min-content 1fr;
  overflow: scroll;
`