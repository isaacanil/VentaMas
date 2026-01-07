// @ts-nocheck
import PropTypes from 'prop-types';
import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import { SelectCartData } from '@/features/cart/cartSlice';
import { ARValidateMessage } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/components/ARValidateMessage/ARValidateMessage';
import { MarkAsReceivableButton } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/MarkAsReceivableButton';
import { useARValidation } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/useARValidation';
import { ReceivableWidget } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/components/ReceivableWidget/ReceivableWidget';
import { ReceivableManagementPanel } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel';

const AccountsReceivableManager = ({
  hasAccountReceivablePermission,
  creditLimit,
  form,
  receivableStatus,
  abilitiesLoading,
}) => {
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

AccountsReceivableManager.propTypes = {
  hasAccountReceivablePermission: PropTypes.bool.isRequired,
  creditLimit: PropTypes.any,
  form: PropTypes.any,
  receivableStatus: PropTypes.bool,
  abilitiesLoading: PropTypes.bool.isRequired,
};

export default AccountsReceivableManager;
