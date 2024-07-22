import { DateTime } from 'luxon'
import React, { useRef } from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { columns } from '../tableData'
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable'

export const SaleReportTable = ({ bills = [], searchTerm, loading = false }) => {

  const data = bills?.map((data) => {
    return {
      numberID: data?.numberID,
      client: data?.client?.name || "Generic Client",
      date: DateTime.fromMillis(data?.createdAt?.seconds * 1000).toLocaleString(DateTime.DATETIME_MED),
      createdBy: data?.user?.displayName,
      total: useFormatPrice(data?.totalAmount),
      change: data?.change?.value,
      dateGroup: DateTime.fromMillis(data?.createdAt?.seconds * 1000).toLocaleString(DateTime.DATE_FULL),
      accion: { data },
    }
  })

  const total = useFormatPrice((bills.reduce((total, { data }) => total + data?.totalPaid?.value, 0)))

  return (
    <AdvancedTable
      columns={columns}
      data={data}
      groupBy={'dateGroup'}
      emptyText="No se encontraron facturas para la fecha seleccionada. Por favor, intente nuevamente o realice un pago."
      footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
      searchTerm={searchTerm}
      elementName={'facturas'}
      tableName={'account-receivable-receipt'}
      numberOfElementsPerPage={40}
      loading={loading}
    />
  )
}

const TotalContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.2em 0.5em;
  gap: 0.5em;

 
    font-size: 1em;
    font-weight: 600;
  
`

const Container = styled.div`
  
  display: flex;
  overflow: hidden;
`

