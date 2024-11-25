import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { AdvancedTable } from '../../../../templates/system/AdvancedTable/AdvancedTable'
import { getProductsTax, getProductsTotalPrice, getTotalItems } from '../../../../../utils/pricing'
import { tableConfig } from './tableConfig'

export const PreSaleTable = ({ preSales = [], searchTerm }) => {

  const data = preSales?.map(({ data }) => {
    const nfc = data?.NCF
    return {
      numberID: data?.preorderDetails?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name,
      date: data?.preorderDetails?.date?.seconds,
      itbis: getProductsTax(data?.products || []),
      products: getTotalItems(data?.products || []),
      status: data?.status, // Estatus de la preventa
      total: getProductsTotalPrice(data?.products || [], 0, 0, nfc),
      accion: { data },
      dateGroup: DateTime.fromMillis(data?.preorderDetails?.date?.seconds * 1000).toLocaleString(DateTime.DATE_FULL)
    }
  })

  const total = useFormatPrice((preSales?.reduce((total, { data }) => total + data?.totalPurchase?.value, 0)))

  return (
    <AdvancedTable
      columns={tableConfig}
      data={data}
      groupBy={'dateGroup'}
      emptyText='No se encontraron preventas.'
      footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
      searchTerm={searchTerm}
      elementName={'preventas'}
      tableName={'Preventas'}
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


