import React, {Fragment} from 'react';
import styled from 'styled-components';
import CustomInput from '../../../../templates/system/Inputs/CustomInput';
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4';
import { useDispatch, useSelector } from 'react-redux';
import { CancelShipping, SelectCartData, SelectSettingCart, selectCart, setCartId, toggleCart, toggleInvoicePanelOpen } from '../../../../../features/cart/cartSlice';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { Delivery } from './components/Delivery/Delivery';
import { validateInvoiceCart } from '../../../../../utils/invoiceValidation';
import { useState } from 'react';
import { useEffect } from 'react';
import * as antd from 'antd'
import { AnimatedNumber } from '../../../../templates/system/AnimatedNumber/AnimatedNumber';
import { fbAddPreOrder } from '../../../../../firebase/invoices/fbAddPreocer';
import { selectUser } from '../../../../../features/auth/userSlice';
import { clearTaxReceiptData } from '../../../../../features/taxReceipt/taxReceiptSlice';
import { deleteClient, setIsOpen } from '../../../../../features/clientCart/clientCartSlice';
import { PreorderConfirmation } from './components/Delivery/PreorderConfirmation/PreorderConfirmation';
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth';

const InvoiceSummary = () => {
  const [isCartValid, setIsCartValid] = useState(false)
  const cart = useSelector(selectCart);
  const user = useSelector(selectUser)
  const [isOpenPreorderConfirmation, setIsOpenPreorderConfirmation] = useState(false)
  const cartData = cart?.data;
  const total = cartData?.totalPurchase?.value;
  const subTotal = cartData?.totalPurchaseWithoutTaxes?.value;
  const itbis = cartData.totalTaxes.value;
  const [loading, setLoading] = useState(false)
  const { billing } = useSelector(SelectSettingCart)
  const dispatch = useDispatch()
  const viewport = useViewportWidth();

  useEffect(() => {
    const { isValid } = validateInvoiceCart(cartData)
    setIsCartValid(isValid)
  }, [cartData])

  const handleInvoicePanelOpen = () => {
    const { isValid, message } = validateInvoiceCart(cartData)
    if (isValid) {
      dispatch(toggleInvoicePanelOpen())
      dispatch(setCartId())
    } else {
      antd.notification.error({
        description: message
      })
    }
  }
  const handleCancelShipping = () => {
    if (viewport <= 800) dispatch(toggleCart());
    dispatch(CancelShipping())
    dispatch(clearTaxReceiptData())
    dispatch(deleteClient())
    dispatch(clearTaxReceiptData())
}
  const handleSavePreOrder = async () => {
    const { isValid, message } = validateInvoiceCart(cartData);
    try {
    
        await fbAddPreOrder(user, cartData)
        handleCancelShipping()
        setIsOpenPreorderConfirmation(false)
        antd.notification({
          message: 'Preorden guardada con éxito',
          type: 'success'

        })
   
    } catch (error) {
      console.error('Error al guardar la preorden:', error)
    }

  };

  return (
    <Fragment>
    <SummaryContainer>
      <LineItem>
        <Label>SubTotal:</Label>
        <Label>{useFormatPrice(subTotal)}</Label>
      </LineItem>
      <LineItem>
        <Label>ITBIS:</Label>
        <Label>{useFormatPrice(itbis)}</Label>
      </LineItem>
      <Delivery />
      <LineItem>
        <Label>Descuento (%):</Label>
        <CustomInput options={["10", "20", "30", "40", "50"]} />
      </LineItem>
      <TotalLine>
        {
          billing?.billingMode === "direct" && (
            <Button
              onClick={handleInvoicePanelOpen}
              disabled={!isCartValid && !billing?.isLoading}
            >
              Facturar
            </Button>
          )
        }
        {
          billing?.billingMode === "deferred" && (
            <Button
              onClick={ () => setIsOpenPreorderConfirmation(true)}
              disabled={!isCartValid && !billing?.isLoading}
            >
              Preventa
            </Button>
          )
        }
        <TotalLabel>
          <AnimatedNumber value={useFormatPrice(total)} />
        </TotalLabel>
      </TotalLine>
    </SummaryContainer>
    <PreorderConfirmation
      open={isOpenPreorderConfirmation}
      onCancel={() => setIsOpenPreorderConfirmation(false)}
      onConfirm={handleSavePreOrder}
      preorder={{data: cartData}}
      
    />
    </Fragment>
  );
};

export default InvoiceSummary;

const SummaryContainer = styled.div`
  border-radius: 5px;
  padding: 0px 10px;
`;

export const LineItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  :first-child {
    border-bottom: 1px solid #ccc;
  }
  :last-child {
    border-top: 1px solid #ccc;
    padding: 0;
  }
 
  align-items: center;
`;

const TotalLine = styled(LineItem)`
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  :disabled {
    background-color: #8a8a8a;
    cursor: not-allowed;
    :hover {
      background-color: #585858;
    }
  }
  :not(:disabled):hover {
    background-color: #0056b3;
  }
`;
const TotalLabel = styled.span`
  font-weight: bold;
  font-size: 1.2em;
  height: 2.4em;
  display: grid;
  align-content: center;
`;
export const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
 `