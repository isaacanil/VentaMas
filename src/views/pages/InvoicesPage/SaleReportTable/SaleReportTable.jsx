import { MoreOutlined } from '@ant-design/icons';
import { faMoneyBillWave, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, notification, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { setAccountPayment } from '../../../../features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectBusinessData } from '../../../../features/auth/businessSlice';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import { addInvoice } from '../../../../features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '../../../../features/invoice/invoicePreviewSlice';
import { useFbGetAccountReceivableByInvoice } from '../../../../firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { downloadInvoiceLetterPdf } from '../../../../firebase/quotation/downloadQuotationPDF';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import {
  convertInvoiceDateToMillis,
  prepareInvoiceForEdit,
  getInvoicePaymentInfo,
} from '../../../../utils/invoice';
import { getProductsTax, getTotalItems } from '../../../../utils/pricing';
import { Invoice } from '../../../component/Invoice/components/Invoice/Invoice';
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable';
import { Tag } from '../../../templates/system/Tag/Tag';
import useInvoiceEditAuthorization from '../hooks/useInvoiceEditAuthorization.jsx';

const isInvoiceEditLocked = (invoice) => {
  const timestampMs = convertInvoiceDateToMillis(invoice?.date);
  if (!Number.isFinite(timestampMs)) {
    return true;
  }
  const elapsedMs = Date.now() - timestampMs;
  return elapsedMs >= 48 * 60 * 60 * 1000;
};

const ActionsMenu = ({ value }) => {
  const dispatch = useDispatch();
  const data = value.data;
  const business = useSelector(selectBusinessData) || {};
  const componentToPrintRef = useRef(null);
  const cartSettings = useSelector(SelectSettingCart);
  const invoiceType = cartSettings.billing.invoiceType;

  const isEditDisabled = useMemo(() => {
    return isInvoiceEditLocked(data);
  }, [data?.date]);

  const proceedToEdit = useCallback(
    (authorization) => {
      const preparedInvoice = prepareInvoiceForEdit(data);
      if (preparedInvoice) {
        dispatch(
          addInvoice({
            invoice: preparedInvoice,
            mode: 'edit',
            authorizationRequest: authorization || null,
          }),
        );
      }
    },
    [data, dispatch],
  );

  const { handleEdit, authorizationModal, isProcessing } =
    useInvoiceEditAuthorization({
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

  const isReceivableInvoice = Boolean(
    data?.isAddedToReceivables ||
      data?.accountsReceivable ||
      data?.snapshot?.cart?.isAddedToReceivables,
  );

  const { accountsReceivable: receivableAccounts = [], loading: receivableLoading } =
    useFbGetAccountReceivableByInvoice(
      isReceivableInvoice ? data?.id : null,
    );

  const receivableAccount = receivableAccounts?.[0];

  const handlePayReceivable = useCallback(() => {
    if (!receivableAccount) {
      notification.warning({
        message: 'Cuenta por cobrar no encontrada',
        description:
          'No se pudo localizar la cuenta por cobrar asociada a esta factura.',
      });
      return;
    }

    const arBalance = Number(
      receivableAccount?.arBalance ?? receivableAccount?.currentBalance ?? 0,
    );

    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          clientId: data?.client?.id,
          arId: receivableAccount.id,
          paymentScope: 'account',
          paymentOption: 'balance',
          totalAmount: arBalance,
          totalPaid: 0,
        },
        extra: {
          ...receivableAccount,
          arBalance,
        },
      }),
    );
  }, [data?.client?.id, dispatch, receivableAccount]);

  const menuItems = useMemo(() => {
    const items = [
      {
        key: 'preview',
        label: 'Ver detalle',
        icon: icons.editingActions.show,
        disabled: false,
      },
      {
        key: 'edit',
        label: 'Editar factura',
        icon: icons.editingActions.edit,
        disabled: isEditDisabled || isProcessing,
      },
      {
        key: 'print',
        label: 'Imprimir factura',
        icon: <FontAwesomeIcon icon={faPrint} />,
        disabled: false,
      },
    ];

    if (isReceivableInvoice) {
      items.push({
        key: 'payReceivable',
        label: 'Pagar CxC',
        icon: <FontAwesomeIcon icon={faMoneyBillWave} />,
        disabled: receivableLoading || !receivableAccount,
      });
    }

    return items;
  }, [
    isEditDisabled,
    isProcessing,
    isReceivableInvoice,
    receivableAccount,
    receivableLoading,
  ]);

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'print':
        handleInvoicePrinting();
        break;
      case 'edit':
        handleEditClick();
        break;
      case 'preview':
        handleViewMore();
        break;
      case 'payReceivable':
        handlePayReceivable();
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <HiddenPrintArea>
        <Invoice ref={componentToPrintRef} data={data} />
      </HiddenPrintArea>
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button
          icon={<MoreOutlined />}
          title={
            isEditDisabled
              ? 'Las facturas solo se pueden editar durante las primeras 48 horas.'
              : undefined
          }
        />
      </Dropdown>
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
      if (value === null || value === undefined) {
        return <span>-</span>;
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return <div>{value}</div>;
      }
      return <span>-</span>;
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
      if (!Number.isFinite(value)) {
        return 'Fecha no disponible';
      }
      const dt = DateTime.fromSeconds(value);
      const datePart = dt.toFormat('dd/LL/yyyy');
      const timePart = dt.toFormat('h:mm a');

      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <span>{datePart}</span>
          <span style={{ color: 'var(--colorText2, #494d64)' }}>{timePart}</span>
        </div>
      );
    },
    maxWidth: '1fr',
    minWidth: '80px',
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
    Header: 'CANT.',
    accessor: 'products',
    align: 'right',
    description: 'Articulos comprados',
    maxWidth: '1fr',
    minWidth: '100px',
  },
  {
    Header: 'Estado',
    accessor: 'paymentStatus',
    align: 'right',
    maxWidth: '1fr',
    minWidth: '200px',
    cell: ({ value }) => {
      const pendingLabel = useFormatPrice(value?.pending || 0);

      if (!value || (!value.total && !value.paid)) {
        return <Tag>Sin datos</Tag>;
      }

      return (
        <PaymentStatusCell>
          {value?.isPaidInFull ? (
            <PaymentBadge $complete>Pagada</PaymentBadge>
          ) : (
            <Tooltip placement="left" title={<PendingTooltip value={value} />}>
              <PendingChip>{pendingLabel}</PendingChip>
            </Tooltip>
          )}
        </PaymentStatusCell>
      );
    },
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
    minWidth: '60px',
    clickable: false,
    cell: ({ value }) => <ActionsMenu value={value} />,
  },
];

const SaleReportTable = ({ bills = [], searchTerm }) => {
  const dispatch = useDispatch();
  const data = bills?.map(({ data }) => {
    const invoiceDateMs = convertInvoiceDateToMillis(data?.date);
    const invoiceDateSeconds = Number.isFinite(invoiceDateMs)
      ? Math.floor(invoiceDateMs / 1000)
      : null;
    const paymentInfo = getInvoicePaymentInfo(data);

    return {
      numberID: data?.numberID,
      ncf: data?.NCF,
      client: data?.client?.name || 'Generic Client',
      date: invoiceDateSeconds,
      itbis: getProductsTax(data?.products),
      payment: data?.payment?.value,
      products: getTotalItems(data?.products),
      change: data?.change?.value,
      total: paymentInfo.total,
      paymentStatus: paymentInfo,
      ver: { data },
      accion: { data },
      dateGroup: invoiceDateMs
        ? DateTime.fromMillis(invoiceDateMs).toLocaleString(DateTime.DATE_FULL)
        : 'Fecha no disponible',
    };
  });

  const total = useMemo(
    () =>
      useFormatPrice(
        bills.reduce(
          (total, { data }) => total + Number(data?.totalPurchase?.value || 0),
          0,
        ),
      ),
    [bills],
  );
  return (
    <AdvancedTable
      columns={columns}
      data={data}
      groupBy={'dateGroup'}
      emptyText="No se encontraron facturas para la fecha seleccionada. Realice ventas y aparecerán en esta sección"
      footerLeftSide={<TotalContainer>Total: {total} </TotalContainer>}
      searchTerm={searchTerm}
      elementName={'facturas'}
      tableName={'Facturas'}
      numberOfElementsPerPage={40}
      rowSize="large"
      enableVirtualization={true}
      showPagination={false}
      rowBorder={true}
      onRowClick={(row) => {
        const invoiceData =
          row?.accion?.data || row?.ver?.data || row?.data || null;
        if (!invoiceData) return;

        if (isInvoiceEditLocked(invoiceData)) {
          notification.warning({
            message: 'Edición no disponible',
            description:
              'Esta factura supera las 48 horas y ya no puede ser editada.',
          });
          return;
        }

        const preparedInvoice = prepareInvoiceForEdit(invoiceData);
        if (!preparedInvoice) {
          notification.error({
            message: 'No se pudo abrir la edición',
            description:
              'Ocurrió un problema preparando la factura para editar.',
          });
          return;
        }

        dispatch(
          addInvoice({
            invoice: preparedInvoice,
            mode: 'edit',
            authorizationRequest: null,
          }),
        );
      }}
    />
  );
};

const TotalContainer = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: flex-end;
  padding: 0.2em 0.5em;
  font-size: 1em;
  font-weight: 600;
`;

const PaymentStatusCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const PaymentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $complete }) => ($complete ? '#237804' : '#d48806')};
  background: ${({ $complete }) =>
    $complete ? 'rgba(82, 196, 26, 0.12)' : 'rgba(250, 173, 20, 0.14)'};
  border: 1px solid
    ${({ $complete }) => ($complete ? '#b7eb8f' : '#ffd591')};
`;

const PendingChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 96px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #fff1f0;
  color: #cf1322;
  font-weight: 700;
  font-size: 12px;
  border: 1px solid #ffa39e;
`;

const PendingTooltip = ({ value }) => (
  <div style={{ display: 'grid', gap: 4 }}>
    <div>Pendiente: {useFormatPrice(value?.pending || 0)}</div>
    <div>Abono: {useFormatPrice(value?.paid || 0)}</div>
    <div>Total: {useFormatPrice(value?.total || 0)}</div>
  </div>
);

const HiddenPrintArea = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
`;

export default SaleReportTable;
