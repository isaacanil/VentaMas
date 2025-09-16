import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormatPrice } from "../../../hooks/useFormatPrice";
import { getTimeElapsed } from "../../../hooks/useFormatTime";
import { faPrint, faReceipt } from "@fortawesome/free-solid-svg-icons";
import { useReactToPrint } from "react-to-print";
import { useEffect, useRef, useState } from "react";
import { icons } from "../../../constants/icons/icons";
import {Button} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice } from "../../../features/invoice/invoiceFormSlice";
import DateUtils from "../../../utils/date/dateUtils";
import { selectUser } from "../../../features/auth/userSlice";
// import { fbCashCountStatus } from "../../../firebase/cashCount/fbCashCountStatus"; // Temporalmente deshabilitado
import { Tag } from "../../templates/system/Tag/Tag";
import { openInvoicePreviewModal } from "../../../features/invoice/invoicePreviewSlice";
import { Invoice } from "../../component/Invoice/components/Invoice/Invoice";
import { selectBusinessData } from "../../../features/auth/businessSlice";
import { downloadInvoiceLetterPdf } from "../../../firebase/quotation/downloadQuotationPDF";
import { notification } from "antd";
import { SelectSettingCart } from "../../../features/cart/cartSlice";
// import { RequestInvoiceEditAuthorization } from "../../component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization"; // Temporalmente deshabilitado
// import { getActiveApprovedAuthorizationForInvoice, markAuthorizationUsed } from "../../../firebase/authorizations/invoiceEditAuthorizations"; // Temporalmente deshabilitado

// NOTE: 2025-09 Temporal: Se deshabilitó la lógica de autorizaciones para edición de facturas.
// El cajero puede editar directamente mientras se termina el módulo de autorizaciones.
// Para reactivar, restaurar imports y estados comentados dentro de este archivo.
const EditButton = ({ value }) => {
  const dispatch = useDispatch()
  const data = value.data;
  const user = useSelector(selectUser)
  const business = useSelector(selectBusinessData) || {};
  const componentToPrintRef = useRef(null)
  // Autorización temporalmente deshabilitada: permitir edición directa
  // const [isCashCountOpen, setIsCashCountOpen] = useState(false);
  // const [requestOpen, setRequestOpen] = useState(false);
  // const [reasonList, setReasonList] = useState([]);
  // const isOlderThan24h = data?.date?.seconds < (Date.now() / 1000) - 86400;
  const cartSettings = useSelector(SelectSettingCart)
  const invoiceType = cartSettings.billing.invoiceType;

  // useEffect(() => {
  //   // Comprobación de cuadre de caja deshabilitada temporalmente
  // }, [user?.businessID, data?.cashCountId]);

  const proceedToEdit = () => {
    const invoiceData = {
      ...data,
      date: DateUtils.convertTimestampToMillis(data.date),
      payWith: data?.paymentMethod.find((method) => method.status === true)?.value,
      updateAt: DateUtils.convertTimestampToMillis(data?.updateAt),
      cancel: data?.cancel ? {
        ...data.cancel,
        cancelledAt: DateUtils.convertTimestampToMillis(data?.cancel?.cancelledAt),
      } : null
    }
    dispatch(addInvoice({ invoice: invoiceData }))
  }

  const handleEdit = async () => {
    // Lógica de autorización temporalmente deshabilitada: edición directa
    proceedToEdit();
    // Código previo conservado como referencia:
    /*
    // Cashier must pass checks; admin/owner/dev bypass
    const role = user?.role;
    const isPrivileged = ['admin', 'owner', 'dev'].includes(role);
    const baseAllowed = isPrivileged || (!isOlderThan24h && isCashCountOpen);
    if (baseAllowed) { proceedToEdit(); return; }
    try {
      const approved = await getActiveApprovedAuthorizationForInvoice(user, data);
      if (approved) {
        try { await markAuthorizationUsed(user, approved.id, user); } catch {}
        proceedToEdit();
        return;
      }
    } catch (e) {}
    const reasons = [];
    if (isOlderThan24h) reasons.push('La factura tiene más de 24 horas.');
    if (!isCashCountOpen) reasons.push('El cuadre de caja no está abierto.');
    setReasonList(reasons);
    setRequestOpen(true);
    */
  }
  const handleRePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  })
  const handleInvoicePrinting = async () => {
    if (invoiceType === 'template2') {
      try {
        await downloadInvoiceLetterPdf(business, data, () => {
          notification.success({
            message: 'PDF Generado',
            description: 'El PDF ha sido generado exitosamente',
            duration: 4
          });
        });
      } catch (e) {
        notification.error({
          message: 'Error al imprimir',
          description: `No se pudo generar el PDF: ${e.message}`,
          duration: 4
        });
        console.error('❌ PDF generation failed:', e);
        console.error('❌ Error stack:', e.stack);
      }
    } else {
      handleRePrint();
    }
  }

  const handleViewMore = () => {
    dispatch(openInvoicePreviewModal(data))
  }

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
    }}>      
    <Invoice ref={componentToPrintRef} data={data} />
      <Button
        icon={<FontAwesomeIcon icon={faPrint} />}
        onClick={handleInvoicePrinting}
      />
      <Button
        icon={icons.editingActions.edit}
        onClick={handleEdit}
        // Edición habilitada; se pedirá autorización cuando aplique
        disabled={false}
      />
      <Button
        icon={icons.editingActions.show}
        onClick={handleViewMore}
      />
      {/** Modal de autorización temporalmente deshabilitado **/}
      {false && (
        <RequestInvoiceEditAuthorization
          isOpen={requestOpen}
          setIsOpen={setRequestOpen}
          invoice={data}
          reasons={reasonList}
          onRequested={() => { /* no-op */ }}
        />
      )}
    </div>
  )
}

export const columns = [
  {
    Header: 'N°',
    accessor: 'numberID',
    sortable: true,
    align: 'left',
    maxWidth: '0.4fr',
    min: '90px',
  },

  {
    Header: 'RNC',
    accessor: 'ncf',
    sortable: true,
    align: 'left',
    maxWidth: '1.4fr',
    min: '150px',
    cell: ({ value }) => {
      if (!value) return (
        <Tag>
          No Disponible
        </Tag>
      )
      return (
        <div>
          {value}
        </div>
      )
    }
  },
  {
    Header: 'Cliente',
    accessor: 'client',
    sortable: true,
    align: 'left',
    maxWidth: '1.6fr',
    minWidth: '200px',
  },
  {
    Header: 'Fecha',
    accessor: 'date',
    sortable: true,
    align: 'left',
    cell: ({ value }) => {
      const time = value * 1000
      return (getTimeElapsed(time, 0))
    },
    maxWidth: '1fr',
    minWidth: '140px',
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
    minWidth: '120px',
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
    minWidth: '180px',
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
      cell: ({ value }) => {
        if (!value) return (
          <div>Hola</div>
        )
        return (
          <div>
            {value}
          </div>
        )
      }
    },
    {
      name: 'Cliente',
      align: 'left',
      description: 'Nombre del cliente que realizó la compra',
      max: '1.8fr',
      min: '170px',
    },
    {
      name: 'Fecha 6',
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


