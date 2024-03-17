import { DateTime } from 'luxon'
import React, { useRef } from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { columns } from '../tableData'
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable'
import { getProductsTax, getProductsTotalPrice, getTotalItems } from '../../../../utils/pricing'

export const SaleReportTable = ({ bills = [], searchTerm }) => {
  
  const data = bills?.map(({ data }) => {
    const nfc = data?.NCF
    return {
      numberID: data?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name || "Generic Client",
      date: data?.date?.seconds,
      itbis: getProductsTax(data?.products),
      payment: data?.payment?.value,
      products: getTotalItems(data?.products),
      change: data?.change?.value,
      total: getProductsTotalPrice(data?.products, 0, 0, nfc),
      ver: { data },
      accion: { data },
      dateGroup: DateTime.fromMillis(data?.date?.seconds * 1000).toLocaleString(DateTime.DATE_FULL)
    }
  })
  const total = useFormatPrice((bills.reduce((total, { data }) => total + data?.totalPurchase?.value, 0)))
  console.log(data.slice(0, 1))
  const handlePaymentMethodValue = () => {
    if (data?.payment?.value) {
      return data?.payment.value
    } else if (data?.cardPaymentMethod.status) {
      return data?.cardPaymentMethod.value
    } else if (data?.cashPaymentMethod.status) {
      return data?.cashPaymentMethod.value
    } else if (data?.transferPaymentMethod.status) {
      return data?.transferPaymentMethod.value
    }
  }
  return (
    
      <AdvancedTable
        columns={columns}
        data={data}
        groupBy={'dateGroup'}
        emptyText='No se encontraron facturas para la fecha seleccionada. Realice ventas y aparecerán en esta sección'
        footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
        searchTerm={searchTerm}
        elementName={'facturas'}
        tableName={'Facturas'}
        numberOfElementsPerPage={40}
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

