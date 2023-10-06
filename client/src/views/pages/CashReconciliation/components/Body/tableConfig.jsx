import { useFormatPrice } from "../../../../../hooks/useFormatPrice"
import { convertTimeStampToDate } from "../../../../../utils/date/convertTimeStampToDate"
import { convertDate, convertMillisToFriendly, convertMillisToISO } from "../../../../../utils/date/formatDate"
import { CashCountStateIndicator } from "../../resource/CashCountStatusIndicator/CashCountStateIndicator"
import { CashCountMetaData } from "../../page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData"
import { DateSection } from "../../page/CashRegisterClosure/components/Header/DateSection"

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
      cell: ({value}) => <CashCountStateIndicator state={value}/>
    },
    {
      accessor: 'date',
      Header: 'Fecha Estado',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '160px',
      cell: ({value}) => convertMillisToFriendly(value)
      // cell: ({value}) => convertMillisToISO(value)/>
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
      cell: ({value}) =>{ 
        return <GetTotalValue cashCount={value} />
      }
    },
    {
      accessor: 'discrepancy',
      Header: 'Resultado', //diferencia y sobrante
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '100px',
      cell: ({value}) =>{ 
        return <GetDiscrepancyValue cashCount={value} />
      }
    },
  ]
  return columns
}

const GetTotalValue = ({cashCount}) => {
  const {totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount);
  return useFormatPrice(totalSystem)
}

const GetDiscrepancyValue = ({cashCount}) => {
  const {totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount);
  return  useFormatPrice(totalDiscrepancy)
}