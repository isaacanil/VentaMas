//name (es el nombre que se muestra en la tabla)
//align (es la alineacion del texto)
//description (es la descripcion que se muestra en el tooltip)
//min (es el ancho minimo de la columna)

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormatPrice } from "../../../hooks/useFormatPrice";
import { getTimeElapsed } from "../../../hooks/useFormatTime";
import { Button } from "../../templates/system/Button/Button";
import { Receipt } from "../checkout/Receipt";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { truncateString } from "../../../utils/text/truncateString";
const PrintButton = ({ value }) => {
  const {data} = value;
  const componentToPrintRef = useRef(null)
  const handleRePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    onAfterPrint: () => setPrinted(true),
  })
  return (
    <div>
      <Receipt ref={componentToPrintRef} data={data} />
      <Button
        width='icon32'
        color='gray-dark'
        variant='container'
        borderRadius='light'
        onClick={handleRePrint}
        title={
          <FontAwesomeIcon icon={faReceipt} />
        }
      />
    </div>
  )
}
//max (es el ancho maximo de la columna)
export const columns = [
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
    maxWidth: '1.8fr',
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
  {
    Header: 'Pago con',
    accessor: 'payment',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Cambio',
    accessor: 'change',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    description: 'Cambio entregado al cliente',
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
    minWidth: '100px',
  },

  {

    Header: 'Ver',
    align: 'right',
    accessor: 'ver',
    description: 'Nombre del vendedor que realizó la venta',
    maxWidth: '0.5fr',
    minWidth: '50px',
    cell: ({ value }) => <PrintButton value={value} />

  }
]
export const tableData = {
  title: 'Reporte de ventas',
  headers: [
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

    }
  ],
  messageNoData: 'No hay datos para mostrar',
};


