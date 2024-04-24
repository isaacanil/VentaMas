import { useFormatPrice } from "../../../../../hooks/useFormatPrice"
import { convertMillisToDate, } from "../../../../../utils/date/formatDate"
import { CashCountStateIndicator } from "../../resource/CashCountStatusIndicator/CashCountStateIndicator"
import { CashCountMetaData } from "../../page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData"
import { DateSection } from "../../page/CashRegisterClosure/components/Header/DateSection"
import * as antd from 'antd'
import { fbLoadInvoicesForCashCount } from "../../../../../firebase/cashCount/fbLoadInvoicesForCashCount"
import { useSelector } from "react-redux"
import { selectUser } from "../../../../../features/auth/userSlice"
import { fbUpdateCashCountTotals } from "../../../../../firebase/cashCount/fbUpdateCashCountTotals"
const { Tag, Dropdown, Button } = antd
import { MoreOutlined } from '@ant-design/icons';

const ActionButtons = ({ data }) => {
  const user = useSelector(selectUser)
  const isOpen = data?.state === 'open' || data?.state === 'closing';
  const id = data?.id;
  const handleReCalculate = async () => {
    const { invoices } = await fbLoadInvoicesForCashCount(user, id, 'all')
    const cashCountMetaData = CashCountMetaData(data, invoices)
    await fbUpdateCashCountTotals(user, id, cashCountMetaData)
    antd.notification.success({ 
      message: 'Totales Recalculados',
      description: 'Los totales de la caja han sido recalculados con éxito',
     })
  }
  const menu = {
    items: [
      {
        label: "Recalcular Totales",
        key: 1,
        //icon: <EditOutlined />,
        onClick: () => handleReCalculate()
      },
    ]
  }

  if (isOpen) {
    return 
  }
  return (
    <Dropdown menu={menu}>
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  )
}

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
      cell: ({ value }) => convertMillisToDate(value)
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
    {
      accessor: 'action',
      Header: 'Acción',
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '100px',
      clickable: false,
      cell: ({ value }) => <ActionButtons data={value} />
    }
  ]
  return columns
}

const GetTotalValue = ({ cashCount }) => {
  console.log('cashCount----', cashCount)
  const { totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount, cashCount?.invoices);
  return useFormatPrice(totalSystem)
}

const GetDiscrepancyValue = ({ cashCount }) => {
  const { totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount);
  return useFormatPrice(totalDiscrepancy)
}