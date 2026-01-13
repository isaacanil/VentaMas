import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { monetarySymbols } from '@/constants/monetarySymbols';
import {
  SelectDelivery,
  SelectTotalTaxes,
  SelectChange,
  setPaymentAmount,
  SelectPaymentValue,
  SelectTotalPurchaseWithoutTaxes,
  SelectDiscount,
} from '@/features/cart/cartSlice';
import { formatPrice } from '@/utils/format';
import { getTotalDiscount } from '@/utils/pricing';
import CustomInput from '@/components/ui/Inputs/CustomInput';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

type PaymentMethodOption = {
  status: boolean;
  method: string;
  name: string;
};


export const PaymentArea = () => {
  const dispatch = useDispatch();
  const ChangeRef = useSelector(SelectChange) as number;
  const TaxesRef = useSelector(SelectTotalTaxes) as number;
  const paymentValue = useSelector(SelectPaymentValue) as number;
  const subTotal = useSelector(SelectTotalPurchaseWithoutTaxes) as number;
  const discountPercent = useSelector(SelectDiscount) as number;
  const discount = getTotalDiscount(subTotal, discountPercent);
  const DeliveryRef = useSelector(SelectDelivery) as {
    value?: number | string | null;
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption[]>([
    {
      status: true,
      method: 'cash',
      name: 'Efectivo',
    },
    {
      status: false,
      method: 'card',
      name: 'Tarjeta',
    },
    {
      status: false,
      method: 'transfer',
      name: 'Transfer...',
    },
  ]);

  const SelectPaymentMethod = (id: string, value: boolean) => {
    setPaymentMethod(
      paymentMethod.map((method) =>
        method.method === id
          ? { ...method, status: value }
          : { ...method, status: false },
      ),
    );
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch(setPaymentAmount(e.target.value));

  return (
    <Container>
      <PaymentOptions>
        {paymentMethod.map((method, index) => {
          return (
            <PaymentOption key={index}>
              <input
                type="radio"
                name="payment-method"
                id={method.method}
                defaultChecked={method.status}
                onChange={(e) => {
                  SelectPaymentMethod(method.method, e.target.checked);
                }}
              />
              <label htmlFor={method.method}>{method.name}</label>
            </PaymentOption>
          );
        })}
      </PaymentOptions>
      <PaymentInfo>
        <LeftSide>
          <Wrapper>
            <Label>Delivery:</Label>
            {formatPrice(DeliveryRef.value)}
          </Wrapper>
          <Wrapper>
            <Label>ITBIS:</Label>
            {formatPrice(TaxesRef)}
          </Wrapper>
          <Wrapper>
            <Label>Cambio:</Label>
            {formatPrice(ChangeRef)}
          </Wrapper>
        </LeftSide>
        <RightSide>
          <CustomInput
            options={['10', '20', '30', '50']}
            value={discountPercent}
            discount={discount}
            onRequestAccess={() => true}
          />
          <InputV4
            label={`Pago con (${monetarySymbols.dollarSign})`}
            labelVariant="primary"
            size="large"
            type="number"
            value={paymentValue}
            onChange={handleChange}
          />
        </RightSide>
      </PaymentInfo>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  gap: 0.4em;
  background-color: white;
`;
const PaymentOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.4em;

  input[type='radio']:checked + label {
    font-weight: 500;
    color: white;
    background-color: #1976d2;
  }

  input[type='radio'] {
    display: none;
  }

  label {
    flex-grow: 1;
    font-weight: 500;
    text-align: center;
    background-color: #ccd7e6;
    border-radius: 4px;
    transition:
      background-color,
      400ms ease-in-out,
      color 400ms ease-in-out;

    &:hover {
      background-color: var(--color3);
    }
  }
`;
const PaymentOption = styled.div`
  display: flex;
  flex-grow: 1;
  gap: 1em;
  align-items: center;

  span {
    display: flex;
    justify-content: space-between;
  }
`;
const LeftSide = styled.div`
  display: grid;
  gap: 0.05em;
`;
const RightSide = styled.div`
  display: grid;
  gap: 0.8em;
  padding: 0.6em 0 0;
`;
const PaymentInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.7fr;
  gap: 1em;
  padding: 0 0.4em;
`;

const Wrapper = styled.span`
  display: flex;
  justify-content: space-between;
`;

const Label = styled.span`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
`;
