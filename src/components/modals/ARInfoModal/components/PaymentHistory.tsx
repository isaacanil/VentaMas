import {
  CalendarOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
} from '@/constants/icons/antd';
import { ProfileOutlined } from '@ant-design/icons';
import { Tooltip, Button, notification } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import {
  collection,
  query,
  where,
  getDocs,
  limit as firestoreLimit,
} from 'firebase/firestore';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import {
  TableCard,
  HighlightCard,
} from '@/components/modals/ARInfoModal/styles';
import {
  formatCurrency,
  formatDate,
} from '@/components/modals/ARInfoModal/utils';
import { AccountsReceivablePaymentReceipt } from '@/modules/checkout/pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt';
import type {
  AccountsReceivableInstallmentPayment,
  AccountsReceivablePaymentReceipt as ARPaymentReceiptData,
  AccountsReceivableSummaryView,
} from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

type InstallmentPaymentRow = AccountsReceivableInstallmentPayment & {
  installmentNumber?: number;
  comments?: string;
};

interface PaymentHistoryProps {
  allowAccountingNavigation?: boolean;
  data?: AccountsReceivableSummaryView | null;
}

const PaymentHistory = ({
  allowAccountingNavigation = false,
  data,
}: PaymentHistoryProps) => {
  const payments = (data?.payments || []) as InstallmentPaymentRow[];
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();

  const [receiptData, setReceiptData] = useState<ARPaymentReceiptData | null>(
    null,
  );
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: () => {
      notification.success({
        message: 'Recibo impreso',
        description: 'El recibo de pago se imprimió correctamente.',
        duration: 3,
      });
    },
  });

  /**
   * Construye un recibo a partir de los datos disponibles en el modal
   * cuando no existe un recibo persistido en Firestore.
   */
  const buildReceiptFromPayment = useCallback(
    (payment: InstallmentPaymentRow): ARPaymentReceiptData => {
      const amount =
        payment.paymentAmount || payment.paymentDetails?.totalPaid || 0;

      const invoiceNumber = String(
        data?.invoice?.numberID ??
          data?.invoice?.number ??
          data?.ar?.numberId ??
          'N/A',
      );

      return {
        id: payment.paymentId || payment.id || '',
        paymentId: payment.paymentId || '',
        clientId: data?.ar?.clientId || '',
        client: data?.client || null,
        user: {
          id: payment.createdBy || null,
          displayName: null,
        },
        createdAt: payment.createdAt,
        totalAmount: amount,
        receiptNumber: '',
        paymentMethod: payment.paymentDetails?.paymentMethods ||
          payment.paymentDetails?.paymentMethod || [],
        change: 0,
        payment: payment.paymentDetails || {
          totalPaid: amount,
        },
        accounts: [
          {
            arNumber: data?.ar?.numberId,
            arId: data?.ar?.id || '',
            invoiceNumber,
            paidInstallments: payment.installmentNumber
              ? [
                  {
                    number: payment.installmentNumber,
                    amount,
                    status: 'paid',
                  },
                ]
              : [],
            totalPaid: amount,
            arBalance:
              (data?.ar?.arBalance ?? data?.ar?.currentBalance ?? 0) as number,
          },
        ],
      } as ARPaymentReceiptData;
    },
    [data],
  );

  const handlePrintReceipt = useCallback(
    (payment: InstallmentPaymentRow) => {
      const paymentId = payment.paymentId;
      if (!user?.businessID) return;

      setLoadingReceipt(paymentId || payment.id || '');
      const receiptPromise = paymentId
        ? (() => {
            const receiptsRef = collection(
              db,
              'businesses',
              user.businessID,
              'accountsReceivablePaymentReceipt',
            );

            const q = query(
              receiptsRef,
              where('paymentId', '==', paymentId),
              firestoreLimit(1),
            );

            return getDocs(q).then(
              (snapshot) => {
                if (snapshot.empty) return null;
                const receiptDoc = snapshot.docs[0];
                return {
                  id: receiptDoc.id,
                  ...receiptDoc.data(),
                } as ARPaymentReceiptData;
              },
              (fetchError) => {
                console.warn(
                  'No se pudo buscar recibo en Firestore, se construirá uno local:',
                  fetchError,
                );
                return null;
              },
            );
          })()
        : Promise.resolve<ARPaymentReceiptData | null>(null);

      void receiptPromise.then(
        (receipt) => {
          const nextReceipt = receipt ?? buildReceiptFromPayment(payment);
          setReceiptData(nextReceipt);

          // Esperar al siguiente render para que el componente de recibo se monte
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              handlePrint();
            });
          });
          setLoadingReceipt(null);
        },
        (error) => {
          console.error('Error preparing receipt:', error);
          notification.error({
            message: 'Error',
            description: 'No se pudo preparar el recibo de pago.',
            duration: 4,
          });
          setLoadingReceipt(null);
        },
      );
    },
    [user, handlePrint, buildReceiptFromPayment],
  );

  const paymentMethodsText = (payment: InstallmentPaymentRow) => {
    const methods = payment?.paymentDetails?.paymentMethods || [];
    if (!methods.length) return 'N/A';

    const methodMap: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      yape: 'Yape',
      plin: 'Plin',
      credit: 'Crédito',
    };

    return methods
      .filter((m) => m.status)
      .map((m) => methodMap[m.method?.toLowerCase()] || m.method)
      .join(', ');
  };

  return (
    <>

      {payments.length > 0 ? (
        <TableCard>
          <div className="table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined /> Pagos registrados
            </div>
            <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
              {payments.length} pagos
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cuota</th>
                <th className="numeric">Monto</th>
                <th>Método</th>
                <th>Usuario</th>
                <th>Notas</th>
                <th style={{ width: 88, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => {
                const amount =
                  payment.paymentAmount ||
                  payment.paymentDetails?.totalPaid ||
                  0;
                const createdBy = payment.createdBy || 'Sistema';
                const paymentDocumentId =
                  payment.paymentId ?? payment.paymentDetails?.id ?? payment.id;
                const canOpenAccountingEntry =
                  allowAccountingNavigation && Boolean(paymentDocumentId);

                return (
                  <tr key={payment.id || index}>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{payment.installmentNumber || '-'}</td>
                    <td className="numeric">{formatCurrency(amount)}</td>
                    <td>{paymentMethodsText(payment)}</td>
                    <td>
                      <Tooltip title={`ID: ${createdBy}`}>
                        {createdBy === 'Sistema' ? 'Sistema' : 'Usuario'}
                      </Tooltip>
                    </td>
                    <td
                      style={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {payment.comments ||
                        payment.paymentDetails?.comments ||
                        '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        {canOpenAccountingEntry ? (
                          <Tooltip title="Ver asiento contable">
                            <Button
                              type="text"
                              size="small"
                              icon={<ProfileOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAccountingEntry({
                                  eventType:
                                    'accounts_receivable.payment.recorded',
                                  sourceDocumentId: paymentDocumentId,
                                  sourceDocumentType:
                                    'accountsReceivablePayment',
                                });
                              }}
                            />
                          </Tooltip>
                        ) : null}
                        <Tooltip title="Imprimir recibo">
                          <Button
                            type="text"
                            size="small"
                            icon={<PrinterOutlined />}
                            loading={
                              loadingReceipt ===
                              (payment.paymentId || payment.id || '')
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintReceipt(payment);
                            }}
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      ) : (
        <HighlightCard $bg="#f9f9f9" $border="#f0f0f0" $iconColor="#8c8c8c">
          <div className="icon-area">
            <ClockCircleOutlined />
          </div>
          <div className="content-area">
            <div className="title">No hay pagos registrados</div>
            <div className="subtitle">
              Aún no se han procesado abonos para esta cuenta.
            </div>
          </div>
        </HighlightCard>
      )}

      {/* Hidden receipt for printing */}
      <div style={{ display: 'none' }}>
        {receiptData && (
          <AccountsReceivablePaymentReceipt
            data={receiptData}
            ref={componentToPrintRef}
          />
        )}
      </div>
    </>
  );
};

export default PaymentHistory;
