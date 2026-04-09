import { MoreOutlined } from '@/constants/icons/antd';
import { faMoneyBillWave, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, notification, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useRef } from 'react';
import type { InvoiceData, InvoiceBusinessInfo } from '@/types/invoice';
import type { InvoiceRecord } from '@/modules/invoice/pages/InvoicesPage/types';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { addInvoice } from '@/features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '@/features/invoice/invoicePreviewSlice';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import { formatPrice } from '@/utils/format';
import {
  convertInvoiceDateToMillis,
  prepareInvoiceForEdit,
  getInvoicePaymentInfo,
} from '@/utils/invoice';
import { isProgrammaticLetterPdfTemplate } from '@/utils/invoice/template';
import { getProductsTax, getTotalItems } from '@/utils/pricing';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { Tag } from '@/components/ui/Tag/Tag';

import useInvoiceEditAuthorization from '../hooks/useInvoiceEditAuthorization';

type CartSettings = {
  billing?: {
    invoiceType?: string;
  };
};

type ActionsMenuProps = {
  value: { data: InvoiceData };
};

type PaymentInfo = ReturnType<typeof getInvoicePaymentInfo>;

type TableRow = {
  numberID?: string | number;
  ncf?: string;
  client?: string;
  date?: number | null;
  itbis?: number;
  payment?: number;
  products?: number;
  change?: number;
  total?: number;
  paymentStatus?: PaymentInfo;
  ver?: { data: InvoiceData };
  accion?: { data: InvoiceData };
  data?: InvoiceData;
  dateGroup?: string;
};

type SaleReportTableProps = {
  bills?: InvoiceRecord[];
  searchTerm: string;
  loading?: boolean;
};

const EMPTY_RECEIVABLE_ACCOUNTS: AccountsReceivableDoc[] = [];
const EMPTY_BILLS: InvoiceRecord[] = [];

const isInvoiceEditLocked = (invoice?: InvoiceData | null) => {
  const timestampMs = convertInvoiceDateToMillis(invoice?.date);
  if (timestampMs === null || !Number.isFinite(timestampMs)) {
    return true;
  }
  const elapsedMs = Date.now() - (timestampMs as number);
  return elapsedMs >= 48 * 60 * 60 * 1000;
};

const ActionsMenu = ({ value }: ActionsMenuProps) => {
  const dispatch = useDispatch();
  const data = value.data;
  const business = useSelector(
    selectBusinessData,
  ) as InvoiceBusinessInfo | null;
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const cartSettings = useSelector(SelectSettingCart) as CartSettings | null;
  const invoiceType = cartSettings?.billing?.invoiceType;

  const isEditDisabled = useMemo(() => {
    return isInvoiceEditLocked(data);
  }, [data]);

  const proceedToEdit = useCallback(
    (authorization?: Record<string, unknown> | null) => {
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
    contentRef: componentToPrintRef,
  });

  const handleInvoicePrinting = async () => {
    if (isProgrammaticLetterPdfTemplate(invoiceType)) {
      try {
        if (business) {
          await downloadInvoicePdf({
            business,
            data,
            onDialogClose: () => {
              notification.success({
                message: 'PDF Generado',
                description: 'El PDF ha sido generado exitosamente',
                duration: 4,
              });
            },
            invoiceType,
          });
        }
      } catch (error: any) {
        notification.error({
          message: 'Error al imprimir',
          description: `No se pudo generar el PDF: ${error?.message || 'Error desconocido'}`,
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

  const snapshotCart = (
    data?.snapshot as { cart?: { isAddedToReceivables?: boolean } } | null
  )?.cart;
  const isReceivableInvoice = Boolean(
    data?.isAddedToReceivables ||
    data?.accountsReceivable ||
    snapshotCart?.isAddedToReceivables,
  );

  const {
    accountsReceivable: receivableAccounts = EMPTY_RECEIVABLE_ACCOUNTS,
    loading: receivableLoading,
  } = useFbGetAccountReceivableByInvoice(
    isReceivableInvoice ? data?.id : null,
  ) as { accountsReceivable: AccountsReceivableDoc[]; loading: boolean };

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
    const preorderNumber =
      data?.preorderDetails?.numberID ?? data?.preorderDetails?.number ?? null;
    const invoiceNumber = data?.numberID ?? data?.number ?? null;
    const isPreorderOrigin =
      receivableAccount?.originType === 'preorder' ||
      Boolean(receivableAccount?.preorderId);

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
          clientName: data?.client?.name,
          clientCode: data?.client?.numberId ?? data?.client?.id,
          documentLabel: isPreorderOrigin ? 'Preventa' : 'Factura',
          documentNumber: isPreorderOrigin
            ? (preorderNumber ?? invoiceNumber)
            : invoiceNumber,
          preorderNumber,
          invoiceNumber,
        },
      }),
    );
  }, [
    data?.client?.id,
    data?.client?.name,
    data?.client?.numberId,
    data?.number,
    data?.numberID,
    data?.preorderDetails?.number,
    data?.preorderDetails?.numberID,
    dispatch,
    receivableAccount,
  ]);

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

  const handleMenuClick = ({ key }: { key: string }) => {
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
        <Invoice
          ref={componentToPrintRef}
          data={data}
          template={invoiceType || undefined}
        />
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

interface CellProps {
  value: any;
}

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
    cell: ({ value }: CellProps) => {
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
    cell: ({ value }: CellProps) => {
      if (!Number.isFinite(value)) {
        return 'Fecha no disponible';
      }
      const dt = DateTime.fromSeconds(value as number);
      const datePart = dt.toFormat('dd/LL/yyyy');
      const timePart = dt.toFormat('h:mm a');

      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <span>{datePart}</span>
          <span style={{ color: 'var(--colorText2, #494d64)' }}>
            {timePart}
          </span>
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
    cell: ({ value }: CellProps) => formatPrice(value),
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
    cell: ({ value }: CellProps) => {
      const pendingLabel = formatPrice(value?.pending || 0);

      if (!value || (!value.total && !value.paid)) {
        return <Tag>Sin datos</Tag>;
      }

      return (
        <PaymentStatusCell>
          {value?.isPaidInFull ? (
            <PaymentBadge $complete={true}>Pagada</PaymentBadge>
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
    cell: ({ value }: CellProps) => formatPrice(value),
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
    cell: ({ value }: CellProps) => <ActionsMenu value={value} />,
  },
];

const SaleReportTable = ({
  bills = EMPTY_BILLS,
  searchTerm,
  loading,
}: SaleReportTableProps) => {
  const dispatch = useDispatch();
  const data = bills?.map(({ data }): TableRow => {
    const invoiceDateMs = convertInvoiceDateToMillis(data?.date);
    const invoiceDateSeconds = Number.isFinite(invoiceDateMs)
      ? Math.floor(invoiceDateMs / 1000)
      : null;
    const paymentInfo = getInvoicePaymentInfo(data);

    return {
      numberID: (data?.numberID ?? undefined) as string | number | undefined,
      ncf: data?.NCF as string | undefined,
      client: data?.client?.name || 'Generic Client',
      date: invoiceDateSeconds,
      itbis: getProductsTax((data?.products || []) as any),
      payment: Number(data?.payment?.value ?? 0),
      products: getTotalItems((data?.products || []) as any),
      change: Number(data?.change?.value ?? 0),
      total: paymentInfo.total,
      paymentStatus: paymentInfo,
      ver: { data: data! },
      accion: { data: data! },
      data,
      dateGroup: invoiceDateMs
        ? DateTime.fromMillis(invoiceDateMs as number).toLocaleString(
            DateTime.DATE_FULL,
          )
        : 'Fecha no disponible',
    };
  });

  const total = useMemo(
    () =>
      formatPrice(
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
      loading={loading}
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
            invoice: preparedInvoice as any,
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

const PaymentBadge = styled.span<{ $complete: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $complete }: { $complete: boolean }) =>
    $complete ? '#237804' : '#d48806'};
  background: ${({ $complete }: { $complete: boolean }) =>
    $complete ? 'rgba(82, 196, 26, 0.12)' : 'rgba(250, 173, 20, 0.14)'};
  border: 1px solid
    ${({ $complete }: { $complete: boolean }) =>
      $complete ? '#b7eb8f' : '#ffd591'};
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

const PendingTooltip = ({ value }: { value: PaymentInfo }) => (
  <div style={{ display: 'grid', gap: 4 }}>
    <div>Pendiente: {formatPrice(value?.pending || 0)}</div>
    <div>Abono: {formatPrice(value?.paid || 0)}</div>
    <div>Total: {formatPrice(value?.total || 0)}</div>
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
