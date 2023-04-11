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


export const SaleReportTable = ({ data, bills, total, }) => {
  // Agrupar las facturas por fecha usando reduce()
  const tableRef = useRef(null)
  const scrolled = useScroll(tableRef)

  return (
    <Table
      col={ColData}
      header={<Header data={data} />}
      body={<Body bills={bills} />}
      bodyMessage={
        bills?.length === 0 && (
          <CenteredText
            text='Actualmente no hay facturas registradas para el día de hoy.'
            showAfter={0}
          />
        )
      }
      footer={<Footer total={total} bills={bills} />}
    />
  )
}


