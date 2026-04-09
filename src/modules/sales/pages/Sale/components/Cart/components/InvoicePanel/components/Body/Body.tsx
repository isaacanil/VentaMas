import { Form, Divider } from 'antd';
import type { FormInstance } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  selectCreditNotePayment,
  setCreditNotePayment,
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
import type { DocumentCurrencyContext } from './components/DocumentCurrencySelector';
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
  businessId?: string | null;
  onMonetaryContextChange?: (ctx: DocumentCurrencyContext) => void;
};

type UserIdentity = {
  businessID?: string;
};

type ClientIdentity = {
  id?: string;
};

export const Body = ({ form, businessId, onMonetaryContextChange }: BodyProps) => {
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
  const { isWithinCreditLimit } = useCreditLimitCheck(
    creditLimit,
    cartData?.change?.value ?? 0,
    clientId,
    user?.businessID,
  );

  const isAddedToReceivables = cartData?.isAddedToReceivables;
  const receivableStatus = Boolean(isAddedToReceivables && isWithinCreditLimit);

  const hasAccountReceivablePermission = abilities.can(
    'manage',
    'accountReceivable',
  );

  const handleCreditNoteSelect = (
    creditNoteSelections: CreditNoteSelection[],
  ) => {
    dispatch(setCreditNotePayment(creditNoteSelections));
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
        <PaymentCard>
          <ChargedSection />
          <InnerDivider />
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
          <InnerDivider />
          <PaymentSummary />
        </PaymentCard>
        <AccountsReceivableManager
          hasAccountReceivablePermission={hasAccountReceivablePermission}
          creditLimit={creditLimit}
          form={form}
          receivableStatus={receivableStatus}
          abilitiesLoading={abilitiesLoading}
        />
        {insuranceEnabled && <InsuranceManagementPanel form={form} />}
        <SectionDivider />
        <InvoiceComment />
        <PrintControl
          businessId={businessId}
          onMonetaryContextChange={onMonetaryContextChange}
        />
      </Container>
    </Form>
  );
};

const Container = styled.div`
  display: grid;
  gap: 0.8em;
`;

const PaymentCard = styled.div`
  display: grid;
  gap: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  padding: 12px;
`;

const InnerDivider = styled.div`
  height: 1px;
  background: #ebebeb;
`;

const SectionDivider = styled(Divider)`
  margin: 0;
`;
