import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'

import { OrderCard } from '../../ListItem/OrderCard'
import { selectUser } from '../../../../../../features/auth/userSlice'
import { useFbGetOrders } from '../../../../../../firebase/order/usefbGetOrders'
import { fbGetPendingOrders } from '../../../../../../firebase/order/fbGetPedingOrder'
import { convertMillisToDate, getTimeElapsed, useFormatDate } from '../../../../../../hooks/useFormatTime'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'
import { getOrderConditionByID, getOrderStateByID, orderAndDataCondition, orderAndDataState } from '../../../../../../constants/orderAndPurchaseState'
import { StatusIndicatorDot } from '../StatusIndicatorDot/StatusIndicatorDot'
import { Button } from '../../../../../templates/system/Button/Button'
import { ActionsButtonsGroup } from '../../ListItem/ActionsButtonsGroup'
import { setNote } from '../../../../../../features/noteModal/noteModalSlice'
import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable'

export const PendingOrdersTable = () => {
  const dispatch = useDispatch();

  const columns = [
    {
      Header: '#',
      accessor: 'number',
      minWidth: '50px',
      maxWidth: '50px',
    },
    {
      Header: 'Est',
      accessor: 'state',
      minWidth: '50px',
      maxWidth: '50px',
      cell: ({ value }) => <StatusIndicatorDot color={value ? getOrderStateByID(value)?.color : null} />
    },
    {
      Header: 'Proveedor',
      accessor: 'provider'
    },
    {
      Header: 'Nota',
      accessor: 'note',
      cell: ({ value }) => (
        <Button
          title='ver'
          borderRadius='normal'
          color='gray-dark'
          border='light'
          onClick={() => dispatch(setNote({ note: value, isOpen: true }))}
        />
      )
    },
    {
      Header: 'F. Pedido',
      accessor: 'createdAt',
      cell: ({ value }) => <div>{convertMillisToDate(value)}</div>
    },
    {
      Header: 'F. Entrega',
      accessor: 'deliveryDate',
      cell: ({ value }) => <div>{convertMillisToDate(value)}</div>
    },
    {
      Header: 'Total',
      accessor: 'total',
      align: 'right',
      minWidth: '120px',
      maxWidth: '120px',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Acción',
      accessor: 'action',
      align: 'right',
      cell: ({ value }) => <ActionsButtonsGroup orderData={value} />,
     
    }
  ]
  const filterConfig = [
    {
      label: 'Proveedor',
      accessor: 'provider',
    },
    {
      label: 'Estado',
      accessor: 'state',
      format: (value) => `${getOrderStateByID(value)?.name}`,
      defaultValue: 'state_2'
    },
    {
      label: 'Condición',
      accessor: 'condition',
      format: (value) => `${getOrderConditionByID(value)}`
    }
  ];

  const user = useSelector(selectUser);
  const { pendingOrders } = fbGetPendingOrders(user);

  const data = pendingOrders.map(({ data }) => {
    return {
      number: data?.numberId,
      state: data?.state,
      provider: data?.provider?.name,
      condition: data?.condition,
      note: data?.note,
      createdAt: data?.dates?.createdAt,
      deliveryDate: data?.dates?.deliveryDate,
      total: data?.total,
      action: data
    }
  })

  return (
    <Container>
      <AdvancedTable
        tableName={'Lista de Pedidos Pendientes'}
        columns={columns}
        data={data}
        filterUI
        filterConfig={filterConfig}
      />
    </Container>
  )
}

const Container = styled.div`
    width: 100vw;
  padding: 0.4em 1em;
  height: 100%;
`