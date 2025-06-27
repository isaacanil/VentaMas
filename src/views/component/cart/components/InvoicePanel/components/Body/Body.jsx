import { Fragment } from 'react'
import styled from 'styled-components'
import { ChargedSection } from './components/ChargedSection/ChargedSection'
import { PaymentMethods } from './components/PaymentMethods/PaymentMethods'
import { PaymentSummary } from './components/PaymentSummary/PaymentSummary'
import { PrintControl } from './components/PrintControl/PrintControl'
import { MarkAsReceivableButton } from './components/MarkAsReceivableButton/MarkAsReceivableButton'
import { ReceivableManagementPanel } from './components/ReceivableManagementPanel/ReceivableManagementPanel'
import { InsuranceManagementPanel } from './components/InsuranceManagementPanel/InsuranceManagementPanel'
import { InvoiceComment } from './components/InvoiceComment/InvoiceComment'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { useSelector } from 'react-redux'
import { selectClient } from '../../../../../../../features/clientCart/clientCartSlice'
import { useCreditLimitCheck } from '../../../../../../../hooks/accountsReceivable/useCheckAccountReceivable'
import { useCreditLimitRealtime } from '../../../../../../../hooks/accountsReceivable/useCreditLimitRealtime'
import { SelectCartData } from '../../../../../../../features/cart/cartSlice'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import useInsuranceEnabled from '../../../../../../../hooks/useInsuranceEnabled'
import { Alert, Form } from 'antd'
import AccountsReceivableManager from './components/AccountsReceivableManager/AccountsReceivableManager'

export const Body = ({ form }) => {    const user = useSelector(selectUser);
    const client = useSelector(selectClient);
    const cartData = useSelector(SelectCartData);
    const clientId = client.id;
    const insuranceEnabled = useInsuranceEnabled();   
     const { abilities, loading: abilitiesLoading } = userAccess();

    const { creditLimit, error, isLoading } = useCreditLimitRealtime(user, clientId);    const {
        activeAccountsReceivableCount,
        isWithinCreditLimit,
        isWithinInvoiceCount,
        creditLimitValue,
        change
    } = useCreditLimitCheck(creditLimit, cartData.change.value, clientId, user.businessID);



    const isAddedToReceivables = cartData?.isAddedToReceivables;
    const receivableStatus = isAddedToReceivables && isWithinCreditLimit;

    const isChangeNegative = cartData.change.value < 0;
    const hasAccountReceivablePermission = abilities.can('manage', 'accountReceivable');

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading credit limit</div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
        >
            <Container>
                <ChargedSection />                
                <PaymentMethods />
                <PaymentSummary />
                <AccountsReceivableManager
                    hasAccountReceivablePermission={hasAccountReceivablePermission}
                    activeAccountsReceivableCount={activeAccountsReceivableCount}
                    creditLimit={creditLimit}
                    isWithinCreditLimit={isWithinCreditLimit}
                    isWithinInvoiceCount={isWithinInvoiceCount}
                    creditLimitValue={creditLimitValue}
                    change={change}
                    clientId={clientId}
                    form={form}
                    isChangeNegative={isChangeNegative}
                    receivableStatus={receivableStatus}
                    abilitiesLoading={abilitiesLoading}
                />
                {insuranceEnabled && <InsuranceManagementPanel form={form} />}
                <InvoiceComment />
                <PrintControl />
            </Container>
        </Form>
    )
}

const Container = styled.div`
        display: grid;
        gap: 1.4em;
    `