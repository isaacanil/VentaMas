import { DollarOutlined, EyeOutlined } from '@/constants/icons/antd';
import { ProfileOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import { useOpenAccountReceivableSummary } from '@/modules/accountsReceivable/hooks/useOpenAccountReceivableSummary';
import { isPreorderDocument } from '@/utils/invoice/documentIdentity';

import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableRecord } from '@/utils/accountsReceivable/types';

interface AccountActionsCellProps {
  value: { account: AccountsReceivableRecord };
}

const AccountActionsCell = ({ value }: AccountActionsCellProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const openAccountReceivableSummary = useOpenAccountReceivableSummary();
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);
  const invoiceId =
    value.account.invoice?.id ?? value.account.account?.invoiceId ?? null;
  const stillPreorder = isPreorderDocument(
    value.account.invoice?.data as Parameters<typeof isPreorderDocument>[0],
  );
  const canOpenAccountingEntry =
    isAccountingRolloutEnabled && Boolean(invoiceId) && !stillPreorder;

  const handleOpenDetail = () => {
    openAccountReceivableSummary(value.account.id);
  };

  const handleOpenAccountingEntry = () => {
    if (!invoiceId) return;

    openAccountingEntry({
      eventType: 'invoice.committed',
      sourceDocumentId: invoiceId,
      sourceDocumentType: 'invoice',
    });
  };

  const handleOpenPayment = () => {
    const account = value.account;
    const client = value.account.client;
    const invoiceData = account?.invoice?.data as
      | {
          numberID?: string | number;
          number?: string | number;
          preorderDetails?: { numberID?: string | number; number?: string | number };
        }
      | undefined;
    const preorderNumber =
      invoiceData?.preorderDetails?.numberID ??
      invoiceData?.preorderDetails?.number ??
      null;
    const invoiceNumber =
      invoiceData?.numberID ?? invoiceData?.number ?? account?.account?.invoiceNumber;
    const isPreorderOrigin =
      account?.account?.originType === 'preorder' ||
      Boolean(account?.account?.preorderId);
    const documentLabel = isPreorderOrigin ? 'Preventa' : 'Factura';
    const documentNumber = isPreorderOrigin
      ? (preorderNumber ?? invoiceNumber)
      : invoiceNumber;
    const result = {
      isOpen: true,
      paymentDetails: {
        clientId: client?.id,
        arId: account.id,
        paymentScope: 'account',
        totalAmount: account.balance ?? 0,
      },
      extra: {
        ...account?.account,
        clientName: client?.name,
        clientCode: (client as { numberId?: string | number })?.numberId ?? client?.id,
        documentLabel,
        documentNumber,
        preorderNumber,
        invoiceNumber,
      },
    };

    dispatch(setAccountPayment(result));
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <Tooltip title="Ver detalle">
        <Button icon={<EyeOutlined />} onClick={handleOpenDetail} />
      </Tooltip>
      {canOpenAccountingEntry ? (
        <Tooltip title="Ver asiento contable">
          <Button
            icon={<ProfileOutlined />}
            onClick={handleOpenAccountingEntry}
          />
        </Tooltip>
      ) : null}
      <Tooltip title="Registrar pago">
        <Button icon={<DollarOutlined />} onClick={handleOpenPayment} />
      </Tooltip>
    </div>
  );
};

export default AccountActionsCell;
