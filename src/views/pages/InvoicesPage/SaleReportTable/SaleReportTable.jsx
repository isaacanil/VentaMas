import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, notification } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { selectBusinessData } from '../../../../features/auth/businessSlice';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import { addInvoice } from '../../../../features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '../../../../features/invoice/invoicePreviewSlice';
import { downloadInvoiceLetterPdf } from '../../../../firebase/quotation/downloadQuotationPDF';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { getTimeElapsed } from '../../../../hooks/useFormatTime';
import { convertInvoiceDateToMillis, prepareInvoiceForEdit } from '../../../../utils/invoice';
import { getProductsTax, getTotalItems } from '../../../../utils/pricing';
import { Invoice } from '../../../component/Invoice/components/Invoice/Invoice';
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable';
import { Tag } from '../../../templates/system/Tag/Tag';
import useInvoiceEditAuthorization from '../hooks/useInvoiceEditAuthorization.jsx';

const EditButton = ({ value }) => {
  const dispatch = useDispatch();
  const data = value.data;
  const business = useSelector(selectBusinessData) || {};
  const componentToPrintRef = useRef(null);
  const cartSettings = useSelector(SelectSettingCart);
  const invoiceType = cartSettings.billing.invoiceType;

  const isEditDisabled = useMemo(() => {
    const timestampMs = convertInvoiceDateToMillis(data?.date);

    if (!Number.isFinite(timestampMs)) {
      return true;
    }

    const elapsedMs = Date.now() - timestampMs;

    return elapsedMs >= 48 * 60 * 60 * 1000;
  }, [data?.date]);

  const proceedToEdit = useCallback((authorization) => {
    const preparedInvoice = prepareInvoiceForEdit(data);
    if (preparedInvoice) {
      dispatch(
        addInvoice({
          invoice: preparedInvoice,
          mode: 'edit',
          authorizationRequest: authorization || null,
        })
      );
    }
  }, [data, dispatch]);

  const { handleEdit, authorizationModal, isProcessing } = useInvoiceEditAuthorization({
    invoice: data,
    onAuthorized: proceedToEdit,
  });

  const handleEditClick = useCallback(() => {
    if (isEditDisabled) {
      return;
    }

    handleEdit();
  }, [handleEdit, isEditDisabled]);

  const handleRePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  const handleInvoicePrinting = async () => {
    if (invoiceType === 'template2') {
      try {
        await downloadInvoiceLetterPdf(business, data, () => {
          notification.success({
            message: 'PDF Generado',
            description: 'El PDF ha sido generado exitosamente',
            duration: 4,
          });
        });
      } catch (error) {
        notification.error({
          message: 'Error al imprimir',
          description: `No se pudo generar el PDF: ${error.message}`,
          duration: 4,
        });
        console.error('❌ PDF generation failed:', error);
      }
    } else {
      handleRePrint();
    }
  };

  const handleViewMore = () => {
    dispatch(openInvoicePreviewModal(data));
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
      }}
    >
      <Invoice ref={componentToPrintRef} data={data} />
      <Button
        icon={<FontAwesomeIcon icon={faPrint} />}
        onClick={handleInvoicePrinting}
      />
      <Button
        icon={icons.editingActions.edit}
        onClick={handleEditClick}
        loading={isProcessing}
        disabled={isEditDisabled}
        title={isEditDisabled ? 'Las facturas solo se pueden editar durante las primeras 48 horas.' : undefined}
      />
      <Button
        icon={icons.editingActions.show}
        onClick={handleViewMore}
      />
      {authorizationModal}
    </div>
  );
};

const columns = [
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
      if (!value) {
        return (
          <Tag>
            No Disponible
          </Tag>
        );
      }
      return (
        <div>
          {value}
        </div>
      );
    },
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
      const timestampMs = convertInvoiceDateToMillis(value);
      if (!Number.isFinite(timestampMs)) {
        return 'Fecha no disponible';
      }
      return getTimeElapsed(timestampMs, 0);
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
  {
    Header: 'Acción',
    align: 'right',
    accessor: 'accion',
    description: 'Accion',
    maxWidth: '1fr',
    minWidth: '180px',
    cell: ({ value }) => <EditButton value={value} />,
  },
];

const SaleReportTable = ({ bills = [], searchTerm }) => {
  const data = bills?.map(({ data }) => {
    const invoiceDateMs = convertInvoiceDateToMillis(data?.date);
    const invoiceDateSeconds = Number.isFinite(invoiceDateMs) ? Math.floor(invoiceDateMs / 1000) : null;

    return {
      numberID: data?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name || "Generic Client",
      date: invoiceDateSeconds,
      itbis: getProductsTax(data?.products),
      payment: data?.payment?.value,
      products: getTotalItems(data?.products),
      change: data?.change?.value,
      total: data?.totalPurchase?.value || 0,
      ver: { data },
      accion: { data },
      dateGroup: invoiceDateMs
        ? DateTime.fromMillis(invoiceDateMs).toLocaleString(DateTime.DATE_FULL)
        : 'Fecha no disponible'
    }
  });

  const total = useMemo(
    () =>
      useFormatPrice(
        bills.reduce(
          (total, { data }) => total + Number(data?.totalPurchase?.value || 0),
          0
        )
      ),
    [bills]
  );
  return (
    <AdvancedTable
      columns={columns}
      data={data}
      groupBy={'dateGroup'}
      emptyText='No se encontraron facturas para la fecha seleccionada. Realice ventas y aparecerán en esta sección'
      footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
      searchTerm={searchTerm}
      elementName={'facturas'}
      tableName={'Facturas'}
      numberOfElementsPerPage={40}
    />
  )
}

const TotalContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.2em 0.5em;
  gap: 0.5em;
  font-size: 1em;
  font-weight: 600;
`

export default SaleReportTable;
