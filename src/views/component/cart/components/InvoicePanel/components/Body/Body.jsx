import { Form } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'

import { selectUser } from '../../../../../../../features/auth/userSlice'
import { SelectCartData, selectCreditNotePayment, setCreditNotePayment, recalcTotals } from '../../../../../../../features/cart/cartSlice'
import { selectClient } from '../../../../../../../features/clientCart/clientCartSlice'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import { useCreditLimitCheck } from '../../../../../../../hooks/accountsReceivable/useCheckAccountReceivable'
import { useCreditLimitRealtime } from '../../../../../../../hooks/accountsReceivable/useCreditLimitRealtime'
import useInsuranceEnabled from '../../../../../../../hooks/useInsuranceEnabled'
import CreditSelector from '../CreditSelector/CreditSelector'

import AccountsReceivableManager from './components/AccountsReceivableManager/AccountsReceivableManager'
import { ChargedSection } from './components/ChargedSection/ChargedSection'
import { CreditNotesSummary } from './components/CreditNotesSummary'
import { InsuranceManagementPanel } from './components/InsuranceManagementPanel/InsuranceManagementPanel'
import { InvoiceComment } from './components/InvoiceComment/InvoiceComment'
import { PaymentMethods } from './components/PaymentMethods/PaymentMethods'
import { PaymentSummary } from './components/PaymentSummary/PaymentSummary'
import { PrintControl } from './components/PrintControl/PrintControl'





export const Body = ({ form }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const client = useSelector(selectClient);
    const cartData = useSelector(SelectCartData);
    const selectedCreditNotes = useSelector(selectCreditNotePayment);
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

    const handleCreditNoteSelect = (creditNoteSelections) => {
        dispatch(setCreditNotePayment(creditNoteSelections));
        dispatch(recalcTotals());
    };

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
                {clientId && clientId !== 'GC-0000' && (
                    <CreditSelector
                        clientId={clientId}
                        onCreditNoteSelect={handleCreditNoteSelect}
                        selectedCreditNotes={selectedCreditNotes}
                        totalPurchase={cartData.totalPurchase.value}
                        paymentMethods={cartData.paymentMethod}
                    />
                )}
                <CreditNotesSummary 
                    selectedCreditNotes={selectedCreditNotes}
                    totalPurchase={cartData.totalPurchase.value}
                />
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