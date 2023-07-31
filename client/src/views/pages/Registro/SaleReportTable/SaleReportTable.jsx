import { DateTime } from 'luxon'
import React, { useRef } from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { Bill } from '../Bill'
import { CenteredText } from '../../../templates/system/CentredText'
import { Row } from '../../../templates/system/Table/Row'
import { ColData } from '../ColumnsData'
import useScroll from '../../../../hooks/useScroll'
import { Table } from '../../../templates/system/Table/Table'
import { Header } from './Header'
import { Body } from './Body'
import { Footer } from './Footer'


export const SaleReportTable = ({ data, bills, total }) => {
  // Agrupar las facturas por fecha usando reduce()

  return (
  
      <Table
        colWidth={data.headers}
        header={<Header data={data.headers} />}
        body={bills.length > 0 && <Body tableConfig={data} bills={bills} />}
        messageNoData={
          bills?.length === 0 && (
            <CenteredText
              text='No se encontraron facturas para la fecha seleccionada. Realice ventas y aparecerán en esta sección'
              showAfter={0}
            />
          )
        }
        footer={<Footer total={total} bills={bills} />}
      />
   

  )
}



