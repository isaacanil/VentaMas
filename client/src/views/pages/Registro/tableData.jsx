//name (es el nombre que se muestra en la tabla)
//align (es la alineacion del texto)
//description (es la descripcion que se muestra en el tooltip)
//min (es el ancho minimo de la columna)

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormatPrice } from "../../../hooks/useFormatPrice";
import { getTimeElapsed } from "../../../hooks/useFormatTime";
import { Button } from "../../templates/system/Button/Button";
import { Receipt } from "../checkout/Receipt";
import { faPrint, faReceipt } from "@fortawesome/free-solid-svg-icons";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { truncateString } from "../../../utils/text/truncateString";
;
import { icons } from "../../../constants/icons/icons";
import * as ant from "antd";
import { useDispatch } from "react-redux";
import { addInvoice } from "../../../features/invoice/invoiceFormSlice";
import { DateTime } from "luxon";
import { convertDate } from "../../../utils/date/convertTimeStampToDate";

const EditButton = ({ value }) => {
  const dispatch = useDispatch()
  const data = value.data;
  const componentToPrintRef = useRef(null)
  const is48HoursOld = data?.date?.seconds < (Date.now() / 1000) - 172800
  const handleEdit = () => {
    const invoiceData = {
      ...data,
      date: convertDate.fromTimestampToMillis(data.date),
      payWith: data?.paymentMethod.find((method) => method.status === true)?.value,
      updateAt: convertDate.fromTimestampToMillis(data?.updateAt),
      cancel: data?.cancel ? {
        ...data.cancel,
        cancelledAt: convertDate.fromTimestampToMillis(data?.cancel?.cancelledAt),
      } : null
    }

    dispatch(addInvoice({ invoice: invoiceData }))
  }
  const handleRePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    onAfterPrint: () => setPrinted(true),
  })

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
    }}>
      <Receipt ref={componentToPrintRef} data={data} />
      <ant.Button
        icon={<FontAwesomeIcon icon={faPrint} />}
        onClick={handleRePrint}
      />

      <ant.Button
        icon={icons.editingActions.edit}
        onClick={handleEdit}
        disabled={is48HoursOld}
      />
    </div>
  )
}
//max (es el ancho maximo de la columna)
export const columns = [
  {
    Header: 'N°',
    accessor: 'numberID',
    sortable: true,
    align: 'left',
    maxWidth: '0.4fr',
    min: '120px',
  },
  {
    Header: 'RNC',
    accessor: 'ncf',
    sortable: true,
    align: 'left',
    maxWidth: '1.4fr',
    min: '150px',
  },
  {
    Header: 'Cliente',
    accessor: 'client',
    sortable: true,
    align: 'left',
    maxWidth: '1.6fr',
    minWidth: '170px',
  },
  {
    Header: 'Fecha',
    accessor: 'date',
    sortable: true,
    align: 'left',
    cell: ({ value }) => getTimeElapsed(value * 1000),
    maxWidth: '1fr',
    minWidth: '160px',
  },
  {
    Header: 'ITBIS',
    accessor: 'itbis',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    maxWidth: '1fr',
    minWidth: '100px',
  },
  // {
  //   Header: 'Pago con',
  //   accessor: 'payment',
  //   align: 'right',
  //   cell: ({ value }) => useFormatPrice(value),
  //   maxWidth: '1fr',
  //   minWidth: '100px',
  // },
  // {
  //   Header: 'Cambio',
  //   accessor: 'change',
  //   align: 'right',
  //   cell: ({ value }) => useFormatPrice(value),
  //   description: 'Cambio entregado al cliente',
  //   maxWidth: '1fr',
  //   minWidth: '100px',
  // },
  {
    Header: 'Articulos',
    accessor: 'products',
    align: 'right',
    description: 'Articulos comprados',
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    description: 'Monto total de la compra',
    maxWidth: '1fr',
    minWidth: '110px',
  },

  // {
  //   Header: 'Ver',
  //   align: 'right',
  //   accessor: 'ver',
  //   description: 'Nombre del vendedor que realizó la venta',
  //   maxWidth: '0.5fr',
  //   minWidth: '50px',
  //   cell: ({ value }) => <PrintButton value={value} />
  // },
  {
    Header: 'Acción',
    align: 'right',
    accessor: 'accion',
    description: 'Accion',
    maxWidth: '1fr',
    minWidth: '80px',
    cell: ({ value }) => <EditButton value={value} />


  }
]
export const tableData = {
  title: 'Reporte de ventas',
  headers: [
    {
      Header: 'N°',
      accessor: 'numberId',
      sortable: true,
      align: 'left',
      maxWidth: '1fr',
      min: '150px',
    },
    {
      name: 'RNC',
      align: 'left',
      description: 'Nombre del vendedor que realizó la venta',
      max: '1.4fr',
      min: '150px',
    },
    {
      name: 'Cliente',
      align: 'left',
      description: 'Nombre del cliente que realizó la compra',
      max: '1.8fr',
      min: '170px',
    },
    {
      name: 'Fecha',
      align: 'left',
      description: 'Fecha en que se realizó la compra',
      max: '1fr',
      min: '160px',
    },
    {
      name: 'ITBIS',
      align: 'right',
      description: 'Impuesto sobre las ventas',
      max: '1fr',
      min: '100px',
    },
    {
      name: 'Pago con',
      align: 'right',
      description: 'Forma de pago utilizada',
      max: '1fr',
      min: '100px',
    },
    {
      name: 'Cambio',
      align: 'right',
      description: 'Cambio entregado al cliente',
      max: '1fr',
      min: '100px',
    },
    {
      name: 'TOTAL',
      align: 'right',
      description: 'Monto total de la compra',
      max: '1fr',
      min: '100px',
    },
    {
      name: 'ver',
      align: 'right',
      description: 'Nombre del vendedor que realizó la venta',
      max: '0.5fr',
      min: '50px'
    },
    {
      name: 'accion',
      align: 'right',
      description: '',
      max: '0.5fr',
      min: '50px'
    }

  ],
  messageNoData: 'No hay datos para mostrar',
};


