import { useFormatPrice } from '@hooks/useFormatPrice';
import * as antd from 'antd'
import KeyValueDisplay from '@templates/system/KeyValueDisplay/KeyValueDisplay';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { setAccountPayment, setPaymentDetails } from '../../../../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectClient } from '../../../../../../../../../../features/clientCart/clientCartSlice';
import { DateTime } from 'luxon';
const { Button, Checkbox, Input } = antd

export function Payment({
  installments,
  installmentAmount,
  lastPayment,
  lastPaymentDate,
  balance,
  isActive,
  account
}) {
  const dispatch = useDispatch()
  const client = useSelector(selectClient);

  const handleOpenPayment = () => {
    dispatch(setAccountPayment({
      isOpen: true,
      paymentDetails: {
        clientId: client.id,
        arId: account.id,
        paymentScope: 'account',
        totalAmount: balance,
      },
      extra: {
       ...account

      }
    }))
  }
  

  return (
    <PaymentRow>
      <KeyValueDisplay
        title={"Cuotas"}
        value={account?.paidInstallments?.length > 0 ? ` ${account?.paidInstallments?.length}/${installments}` : `${installments}`}
      />
      <KeyValueDisplay
        title={"Monto cuota"}
        value={useFormatPrice(installmentAmount)}
      />
      <KeyValueDisplay
        title={"Último pago"}
        value={account?.lastPaymentDate ? `${new DateTime(account?.lastPaymentDate?.seconds * 1000).toFormat('dd/MM/yyyy')} - ${useFormatPrice(account.lastPayment)}` : 'N/A'}
      />
      <Button
        type='primary'
        disabled={!isActive}
        onClick={handleOpenPayment}
      >Pagar</Button>
    </PaymentRow>
  )
}





export const PaymentRow = styled.div`
    display: grid;
    padding: 0.4em;
    grid-template-columns: min-content 0.7fr 1fr min-content;
  
   
  `;