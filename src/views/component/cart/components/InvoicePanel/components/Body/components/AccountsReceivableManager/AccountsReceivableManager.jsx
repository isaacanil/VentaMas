import PropTypes from 'prop-types';
import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import { SelectCartData } from '../../../../../../../../../features/cart/cartSlice';
import { ARValidateMessage } from '../MarkAsReceivableButton/components/ARValidateMessage/ARValidateMessage';
import { MarkAsReceivableButton, useARValidation } from '../MarkAsReceivableButton/MarkAsReceivableButton';
import { ReceivableWidget } from '../ReceivableManagementPanel/components/ReceivableWidget/ReceivableWidget';
import { ReceivableManagementPanel } from '../ReceivableManagementPanel/ReceivableManagementPanel';


const AccountsReceivableManager = ({
  hasAccountReceivablePermission,
  // activeAccountsReceivableCount,
  creditLimit,
  // isWithinCreditLimit,
  // isWithinInvoiceCount,
  // creditLimitValue,
  change,
  // clientId,
  form,
  // isChangeNegative,
  receivableStatus,
  abilitiesLoading,
}) => {
  const [isOpenReceivableManagementPanel, setIsOpenReceivableManagementPanel] = useState(false);

  const closeReceivableManagementPanel = () => setIsOpenReceivableManagementPanel(false);

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

        />        {hasAccountReceivablePermission && (
          <Fragment>
            <MarkAsReceivableButton
              isOpen={isOpenReceivableManagementPanel}
              setIsOpen={setIsOpenReceivableManagementPanel}
              creditLimit={creditLimit}
              activeAccountsReceivableCount={activeAccountsReceivableCount}
              isWithinCreditLimit={isWithinCreditLimit}
              isWithinInvoiceCount={isWithinInvoiceCount}
              creditLimitValue={creditLimitValue}
              change={change}              clientId={clientId}
            />
            
            <ReceivableWidget 
              receivableStatus={receivableStatus}
              isChangeNegative={isChangeNegative}
              onOpenConfig={() => setIsOpenReceivableManagementPanel(true)}
              creditLimit={creditLimit}
            />
            
            <ReceivableManagementPanel
              form={form}
              activeAccountsReceivableCount={activeAccountsReceivableCount}
              isWithinCreditLimit={isWithinCreditLimit}
              isWithinInvoiceCount={isWithinInvoiceCount}
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
          isOpen={isOpenReceivableManagementPanel}
          setIsOpen={setIsOpenReceivableManagementPanel}
          creditLimit={creditLimit}
          activeAccountsReceivableCount={activeAccountsReceivableCount}
          isWithinCreditLimit={isWithinCreditLimit}
          isWithinInvoiceCount={isWithinInvoiceCount}
          creditLimitValue={creditLimitValue}
          change={change}          clientId={clientId}
        />

        <ReceivableWidget 
          receivableStatus={receivableStatus}
          isChangeNegative={isChangeNegative}
          onOpenConfig={() => setIsOpenReceivableManagementPanel(true)}
          creditLimit={creditLimit}
        />

        <ReceivableManagementPanel
          isOpen={isOpenReceivableManagementPanel}
          closePanel={closeReceivableManagementPanel}
          form={form}
          activeAccountsReceivableCount={activeAccountsReceivableCount}
          isWithinCreditLimit={isWithinCreditLimit}
          isWithinInvoiceCount={isWithinInvoiceCount}
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
  activeAccountsReceivableCount: PropTypes.number.isRequired,
  creditLimit: PropTypes.any,
  isWithinCreditLimit: PropTypes.bool.isRequired,
  isWithinInvoiceCount: PropTypes.bool.isRequired,
  creditLimitValue: PropTypes.number.isRequired,
  change: PropTypes.number.isRequired,
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  form: PropTypes.any,
  isChangeNegative: PropTypes.bool.isRequired,
  receivableStatus: PropTypes.bool,
  abilitiesLoading: PropTypes.bool.isRequired,
};

export default AccountsReceivableManager;
