import { useCallback, useState } from 'react';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { openInvoicePreviewModal } from '@/features/invoice/invoicePreviewSlice';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';

import { resolveAccountingOriginTarget } from '../utils/accountingOrigin';

import type { AccountingLedgerRecord } from '../utils/accountingWorkspace';

export const useAccountingOriginNavigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const [openingOriginRecordId, setOpeningOriginRecordId] = useState<string | null>(
    null,
  );

  const openRecordOrigin = useCallback(
    async (record: AccountingLedgerRecord | null) => {
      const target = resolveAccountingOriginTarget(record);
      if (!record || !target) {
        message.info('Este movimiento no tiene un origen navegable todavia.');
        return false;
      }

      setOpeningOriginRecordId(record.id);

      try {
        if (target.kind === 'route') {
          navigate(target.route);
          return true;
        }

        if (!businessId) {
          message.error('No se encontro el negocio activo.');
          return false;
        }

        const invoice = await fbGetInvoice(businessId, target.documentId);
        const invoiceData = invoice?.data;
        if (!invoiceData) {
          message.error('No se pudo cargar la factura origen.');
          return false;
        }

        dispatch(
          openInvoicePreviewModal({
            ...invoiceData,
            id: invoiceData.id ?? target.documentId,
          }),
        );
        return true;
      } catch (error) {
        console.error('Error abriendo documento origen:', error);
        message.error('No se pudo abrir el documento origen.');
        return false;
      } finally {
        setOpeningOriginRecordId((current) =>
          current === record.id ? null : current,
        );
      }
    },
    [businessId, dispatch, navigate],
  );

  return {
    openingOriginRecordId,
    openRecordOrigin,
  };
};
