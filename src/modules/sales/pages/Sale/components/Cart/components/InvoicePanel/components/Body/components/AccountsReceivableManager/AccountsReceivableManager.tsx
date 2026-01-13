import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import { SelectCartData } from '@/features/cart/cartSlice';
import { ARValidateMessage } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/components/ARValidateMessage/ARValidateMessage';
import { MarkAsReceivableButton } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/MarkAsReceivableButton';
import { useARValidation } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/useARValidation';
import { ReceivableWidget } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/components/ReceivableWidget/ReceivableWidget';
import { ReceivableManagementPanel } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel';
import type { FormInstance } from 'antd';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

type AccountsReceivableManagerProps = {
  hasAccountReceivablePermission: boolean;
  creditLimit?: CreditLimitConfig | null;
  form?: FormInstance;
  receivableStatus?: boolean;
  abilitiesLoading: boolean;
};

const AccountsReceivableManager = ({
  hasAccountReceivablePermission,
  creditLimit = null,
  form,
  receivableStatus = false,
  abilitiesLoading,
}: AccountsReceivableManagerProps) => {
  const [isOpenReceivableManagementPanel, setIsOpenReceivableManagementPanel] =
    useState(false);

  const closeReceivableManagementPanel = () =>
    setIsOpenReceivableManagementPanel(false);

  const cartData = useSelector(SelectCartData);

  const {
    isGenericClient,
    isChangeNegative,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    activeAccountsReceivableCount,
    creditLimitValue,
    clientId,
  } = useARValidation(cartData, creditLimit);

  if (isChangeNegative && !abilitiesLoading) {
    return (
      <Fragment>
        <ARValidateMessage
          isGenericClient={isGenericClient}
          clientId={clientId}
          invoiceId={null}
          isWithinCreditLimit={isWithinCreditLimit}
          isWithinInvoiceCount={isWithinInvoiceCount}
          activeAccountsReceivableCount={activeAccountsReceivableCount}
          creditLimit={creditLimit}
          creditLimitValue={creditLimitValue}
          hasAccountReceivablePermission={hasAccountReceivablePermission}
          isChangeNegative={isChangeNegative}
          abilitiesLoading={abilitiesLoading}
        />{' '}
        {hasAccountReceivablePermission && (
          <Fragment>
            <MarkAsReceivableButton
              setIsOpen={setIsOpenReceivableManagementPanel}
              creditLimit={creditLimit}
            />

            <ReceivableWidget
              receivableStatus={receivableStatus}
              isChangeNegative={isChangeNegative}
              onOpenConfig={() => setIsOpenReceivableManagementPanel(true)}
            />

            <ReceivableManagementPanel
              form={form}
              creditLimit={creditLimit}
              isChangeNegative={isChangeNegative}
              receivableStatus={receivableStatus}
              isOpen={isOpenReceivableManagementPanel}
              closePanel={closeReceivableManagementPanel}
            />
          </Fragment>
        )}
      </Fragment>
    );
  }
  if (hasAccountReceivablePermission) {
    return (
      <Fragment>
        <MarkAsReceivableButton
          setIsOpen={setIsOpenReceivableManagementPanel}
          creditLimit={creditLimit}
        />

        <ReceivableWidget
          receivableStatus={receivableStatus}
          isChangeNegative={isChangeNegative}
          onOpenConfig={() => setIsOpenReceivableManagementPanel(true)}
        />

        <ReceivableManagementPanel
          isOpen={isOpenReceivableManagementPanel}
          closePanel={closeReceivableManagementPanel}
          form={form}
          creditLimit={creditLimit}
          isChangeNegative={isChangeNegative}
          receivableStatus={receivableStatus}
        />
      </Fragment>
    );
  }

  return null;
};

export default AccountsReceivableManager;
