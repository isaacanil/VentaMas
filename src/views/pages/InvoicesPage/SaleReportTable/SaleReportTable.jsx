import { DateTime } from 'luxon'
import { useMemo } from 'react'
import styled from 'styled-components'

import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { convertInvoiceDateToMillis } from '../../../../utils/invoice'
import { getProductsTax, getTotalItems } from '../../../../utils/pricing'
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable'
import { columns } from '../tableData'

const SaleReportTable = ({ bills = [], searchTerm }) => {
  const data = bills?.map(({ data }) => {
    const invoiceDateMs = convertInvoiceDateToMillis(data?.date);
    const invoiceDateSeconds = Number.isFinite(invoiceDateMs) ? Math.floor(invoiceDateMs / 1000) : null;

    return {
      numberID: data?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name || "Generic Client",
      date: invoiceDateSeconds,
      itbis: getProductsTax(data?.products),
      payment: data?.payment?.value,
      products: getTotalItems(data?.products),
      change: data?.change?.value,
      total: data?.totalPurchase?.value || 0,
      ver: { data },
      accion: { data },
      dateGroup: invoiceDateMs
        ? DateTime.fromMillis(invoiceDateMs).toLocaleString(DateTime.DATE_FULL)
        : 'Fecha no disponible'
    }
  });

  const total = useMemo(
    () =>
      useFormatPrice(
        bills.reduce(
          (total, { data }) => total + Number(data?.totalPurchase?.value || 0),
          0
        )
      ),
    [bills]
  );
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
export default SaleReportTable;
