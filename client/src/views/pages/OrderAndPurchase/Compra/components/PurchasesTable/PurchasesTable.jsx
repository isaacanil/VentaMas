import React, { useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { getPurchaseFromDB } from '../../../../../../firebase/firebaseconfig'
import { selectUser } from '../../../../../../features/auth/userSlice'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'
import { toggleFileListModal, toggleViewOrdersNotes } from '../../../../../../features/modals/modalSlice'
//import { Button } from '../../../../../templates/system/Button/Button'
import { ActionsButtonsGroup } from '../../ListItem/ActionsButtonsGroup'
import { convertMillisToDate } from '../../../../../../hooks/useFormatTime'
import { setNote } from '../../../../../../features/noteModal/noteModalSlice'
import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable'
import { getOrderConditionByID, getOrderStateByID } from '../../../../../../constants/orderAndPurchaseState'
import { useFbGetPurchase } from '../../../../../../firebase/purchase/fbGetPurchase'
import { toggleImageViewer } from '../../../../../../features/imageViewer/imageViewerSlice'
import * as antd from 'antd'
import { calculateTotalNewStockFromReplenishments } from '../../../Order/components/OrderListTable/PendingOrdersTable'
const { Button } = antd;

function ordenarPorNumberId(datos) {
  // Crear una copia del arreglo para evitar modificar el original
  if (!Array.isArray(datos)) return datos;
  const datosCopia = [...datos];

  // Ordenar la copia del arreglo
  return datosCopia.sort((a, b) => b.data.numberId - a.data.numberId);
}

export const PurchaseTable = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { purchases } = useFbGetPurchase();
  console.log('purchases', purchases)
  const columns = [
    {
      Header: 'Número',
      accessor: 'number'
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
          onClick={() => dispatch(setNote({ note: value, isOpen: true }))}
        >ver</Button>
      )
    },

    {
      Header: 'Fecha',
      accessor: 'date',
      cell: ({ value }) => <div>{convertMillisToDate(value?.deliveryDate)}</div>
    },
    {
      Header: 'F. Pago',
      accessor: 'paymentDate',
      cell: ({ value }) => <div>{convertMillisToDate(value)}</div>
    },
    {
      Header: 'Items',
      accessor: 'items',
      cell: ({ value }) => <div>{value}</div>
    },

    {
      Header: 'Total',
      accessor: 'total',
      align: 'right',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Evidencia',
      accessor: 'fileList',
      align: 'right',
      cell: ({ value }) => {
        const handleShowFiles = () => {
          dispatch(toggleFileListModal({ fileList: value }))
        }
        return (
          <Button
            onClick={handleShowFiles}
          >
            ver
          </Button>
        )
      }
    },
    {
      Header: 'Acción',
      accessor: 'action',
      align: 'right',
      cell: (value) => <ActionsButtonsGroup purchaseData={value} />
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

    },
    {
      label: 'Condición',
      accessor: 'condition',
      format: (value) => `${getOrderConditionByID(value)}`
    }
  ];

  const data = ordenarPorNumberId(purchases)
    .map(({ data }, index) => {
      return {
        state: data?.state,
        condition: data?.condition,
        number: data?.numberId,
        provider: data?.provider.name,
        note: data?.note,
        date: data?.dates,
        fileList: data?.fileList,
        items: calculateTotalNewStockFromReplenishments(data?.replenishments),
        paymentDate: data?.dates?.paymentDate,
        total: data?.total,
        action: data
      }
    })
  console.log(data)
  return (
    <AdvancedTable
      tableName={'Lista de Compras'}
      columns={columns}
      data={data}

      filterUI
      filterConfig={filterConfig}
    />
  )
}


