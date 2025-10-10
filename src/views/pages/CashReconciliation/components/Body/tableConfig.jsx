import { Tag } from 'antd'

import { useFormatPrice } from "../../../../../hooks/useFormatPrice"
import DateUtils from "../../../../../utils/date/dateUtils";
import { CashCountMetaData } from "../../page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData"
import { CashCountStateIndicator } from "../../resource/CashCountStatusIndicator/CashCountStateIndicator"

export const tableConfig = () => {
  let columns = [
    {
      accessor: 'incrementNumber',
      Header: '#',
      align: 'left',
      maxWidth: '0.1fr',
      minWidth: '60px',
    },
    {
      accessor: 'status',
      Header: 'Estado',
      align: 'left',
      maxWidth: '0.3fr',
      minWidth: '120px',
      cell: ({ value }) => <CashCountStateIndicator state={value} />
    },
    {
      accessor: 'date',
      Header: 'Fecha Estado',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '160px',
      //cell: ({value}) => convertMillisToDate(value)
      cell: ({ value }) => DateUtils.convertMillisToFriendlyDate(value)
    },
    {
      accessor: 'user',
      Header: 'Usuario',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '120px',
    },
    {
      accessor: 'total',
      Header: 'Total',
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '150px',
      cell: ({ value }) => {
        const isOpen = value?.state === 'open' || value?.state === 'closing';
        if (isOpen) {
          return <Tag style={{ fontSize: '16px', padding: '5px 10px' }}>Pendiente</Tag>
        }
        return value.totalSystem ? useFormatPrice(value.totalSystem) : 'Total'
        //  return JSON.stringify(useFormatPrice(value.totalSystem))
      }
    },
    {
      accessor: 'discrepancy',
      Header: 'Resultado',
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '100px',
      cell: ({ value }) => {
        const isOpen = value?.state === 'open' || value?.state === 'closing';
        let color = 'success'
        if (isOpen) {
          return <Tag style={{ fontSize: '16px', padding: '5px 10px' }}>Pendiente</Tag>
        }
        switch (true) {
          case value.totalDiscrepancy < 0:
            color = 'error'
            break;
          case value.totalDiscrepancy > 0:
            color = 'warning'
            break;
          default:
            color = 'success'
            break;
        }
        return (
          <Tag color={color} style={{ fontSize: '16px', padding: '5px 10px' }}>
            {useFormatPrice(value.totalDiscrepancy) ?? 'Sobrante'}
          </Tag>
        )
      }
    },
    // {
    //   accessor: 'action',
    //   Header: 'Acción',
    //   align: 'right',
    //   maxWidth: '0.4fr',
    //   minWidth: '100px',
    //   clickable: false,
    //   cell: ({ value }) => <ActionButtons data={value} />
    // }
  ]
  return columns
}

const GetTotalValue = ({ cashCount }) => {
  const { totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount, cashCount?.invoices);
  return useFormatPrice(totalSystem)
}

const GetDiscrepancyValue = ({ cashCount }) => {
  const { totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount);
  return useFormatPrice(totalDiscrepancy)
}