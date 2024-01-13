import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { tableConfig } from './tableConfig'
import { fbGetCashCounts } from '../../../../../firebase/cashCount/fbGetCashCounts/fbGetCashCounts'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'
import { AdvancedTable } from '../../../../templates/system/AdvancedTable/AdvancedTable'
import { useNavigate } from 'react-router-dom'
import { setCashCount } from '../../../../../features/cashCount/cashCountManagementSlice'

export const CashReconciliationTable = () => {
  const [cashCounts, setCashCounts] = useState([])
  const user = useSelector(selectUser)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleClick = (cashCount) => {
    let cashCountToUpdate = {
      ...cashCount,
      opening: {
        ...cashCount.opening,
        date: JSON.stringify(cashCount.opening.date)
      }
    }

    dispatch(setCashCount(cashCountToUpdate));
    navigate(`/cash-register-closure/${cashCountToUpdate?.id}`);
  }

  useEffect(() => {
    fbGetCashCounts(user, setCashCounts)
  }, [user])

  const data = cashCounts.map((cashCount) => {
    return {
      incrementNumber: cashCount?.incrementNumber,
      status: cashCount?.state,
      date: (
        cashCount?.updatedAt?.seconds ?
          cashCount?.updatedAt?.seconds * 1000 :
          null
      ),
      user: cashCount?.opening.employee.name,
      total: cashCount,
      discrepancy: cashCount,
      action: cashCount,
    }
  })

  const columns = tableConfig()
  const handleLabelState = (state) => {
    const stateLabels = {
      open: 'Abierto',
      closing: 'Cerrando Cuadre',
      closed: 'Cerrado',
      pending: 'Pendiente',
    }
    return stateLabels[state] || '';
  }
  const filtersConfig = [
    {
      label: 'Estado',
      accessor: 'status',
      format: (value) => `${handleLabelState(value)}`,
    },
    {
      label: 'Usuarios',
      accessor: 'user',
    }
  ]
  return (
    <Container>

      <AdvancedTable
        columns={columns}
        data={data}
        elementName={'cuadre de caja'}
        tableName={'cash_reconciliation_table'}
        filterConfig={filtersConfig}
        filterUI
        datesFilter
        datesKeyConfig='date'
        onRowClick={(row) => handleClick(row.action)}
      />
    </Container>
  )
}

const Container = styled.div`
  display: grid;

  grid-template-rows: 1fr;
  overflow: hidden;
`