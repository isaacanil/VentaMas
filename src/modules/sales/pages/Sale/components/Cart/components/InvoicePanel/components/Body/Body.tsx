import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  selectCreditNotePayment,
  setCreditNotePayment,
  recalcTotals,
} from '@/features/cart/cartSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { useCreditLimitCheck } from '@/hooks/accountsReceivable/useCheckAccountReceivable';
import { useCreditLimitRealtime } from '@/hooks/accountsReceivable/useCreditLimitRealtime';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import CreditSelector from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/CreditSelector/CreditSelector';
import type { CreditNoteSelection } from '@/types/creditNote';

import AccountsReceivableManager from './components/AccountsReceivableManager/AccountsReceivableManager';
import { ChargedSection } from './components/ChargedSection/ChargedSection';
import { CreditNotesSummary } from './components/CreditNotesSummary';
import { InsuranceManagementPanel } from './components/InsuranceManagementPanel/InsuranceManagementPanel';
import { InvoiceComment } from './components/InvoiceComment/InvoiceComment';
import { PaymentMethods } from './components/PaymentMethods/PaymentMethods';
import { PaymentSummary } from './components/PaymentSummary/PaymentSummary';
import { PrintControl } from './components/PrintControl/PrintControl';

type CartData = {
  change: { value?: number };
  totalPurchase: { value?: number };
  paymentMethod?: Array<{ status?: boolean; method?: string; value?: number }>;
  isAddedToReceivables?: boolean;
};

type BodyProps = {
  form: FormInstance;
};

type UserIdentity = {
  businessID?: string;
};

type ClientIdentity = {
  id?: string;
};

export const Body = ({ form }: BodyProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const client = useSelector(selectClient) as ClientIdentity | null;
  const cartData = useSelector(SelectCartData) as CartData;
  const selectedCreditNotes = useSelector(
    selectCreditNotePayment,
  ) as CreditNoteSelection[];
  const clientId = client?.id ?? '';
  const insuranceEnabled = useInsuranceEnabled();
  const { abilities, loading: abilitiesLoading } = useUserAccess();

  const { creditLimit, error, isLoading } = useCreditLimitRealtime(
    user,
    clientId,
  );
  const {
    isWithinCreditLimit,
  } = useCreditLimitCheck(
    creditLimit,
    cartData?.change?.value ?? 0,
    clientId,
    user?.businessID,
  );

  const isAddedToReceivables = cartData?.isAddedToReceivables;
  const receivableStatus = Boolean(isAddedToReceivables && isWithinCreditLimit);

  const isChangeNegative = (cartData?.change?.value ?? 0) < 0;
  const hasAccountReceivablePermission = abilities.can(
    'manage',
    'accountReceivable',
  );

  const handleCreditNoteSelect = (
    creditNoteSelections: CreditNoteSelection[],
  ) => {
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
    <Form form={form} layout="vertical">
      <Container>
        <ChargedSection />
        <PaymentMethods />
        {clientId && clientId !== 'GC-0000' && (
          <CreditSelector
            clientId={clientId}
            onCreditNoteSelect={handleCreditNoteSelect}
            selectedCreditNotes={selectedCreditNotes}
            totalPurchase={cartData?.totalPurchase?.value ?? 0}
            paymentMethods={cartData?.paymentMethod ?? []}
          />
        )}
        <CreditNotesSummary
          selectedCreditNotes={selectedCreditNotes}
          totalPurchase={cartData?.totalPurchase?.value ?? 0}
        />
        <PaymentSummary />
        <AccountsReceivableManager
          hasAccountReceivablePermission={hasAccountReceivablePermission}
          creditLimit={creditLimit}
          form={form}
          receivableStatus={receivableStatus}
          abilitiesLoading={abilitiesLoading}
        />
        {insuranceEnabled && <InsuranceManagementPanel form={form} />}
        <InvoiceComment />
        <PrintControl />
      </Container>
    </Form>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1.4em;
`;
