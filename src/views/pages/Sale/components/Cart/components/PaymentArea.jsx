import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { monetarySymbols } from '../../../../../../constants/monetarySymbols';
import {
  SelectDelivery,
  SelectTotalTaxes,
  SelectChange,
  setPaymentAmount,
  SelectPaymentValue,
} from '../../../../../../features/cart/cartSlice';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import CustomInput from '../../../../../templates/system/Inputs/CustomInput';
import { InputV4 } from '../../../../../templates/system/Inputs/GeneralInput/InputV4';

export const PaymentArea = () => {
  const dispatch = useDispatch();
  const ChangeRef = useSelector(SelectChange);
  const TaxesRef = useSelector(SelectTotalTaxes);
  const paymentValue = useSelector(SelectPaymentValue);
  const DeliveryRef = useSelector(SelectDelivery);

  const [paymentMethod, setPaymentMethod] = useState([
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

  const SelectPaymentMethod = (id, value) => {
    let SearchingMethod = paymentMethod.find(
      (methodSelected) => methodSelected.method === id,
    );
    setPaymentMethod(
      paymentMethod.map((method) => {
        if (SearchingMethod == method) {
          return { ...method, status: value };
        }
        if (SearchingMethod !== method) {
          return { ...method, status: false };
        }
      }),
    );
  };

  const handleChange = (e) => dispatch(setPaymentAmount(e.target.value));

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
            {useFormatPrice(DeliveryRef.value)}
          </Wrapper>
          <Wrapper>
            <Label>ITBIS:</Label>
            {useFormatPrice(TaxesRef)}
          </Wrapper>
          <Wrapper>
            <Label>Cambio:</Label>
            {useFormatPrice(ChangeRef)}
          </Wrapper>
        </LeftSide>
        <RightSide>
          <CustomInput options={['10', '20', '30', '50']} />
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
  background-color: white;
  display: grid;
  gap: 0.4em;
`;
const PaymentOptions = styled.div`
  display: grid;
  gap: 0.4em;
  grid-template-columns: 1fr 1fr 1fr;

  input[type='radio']:checked + label {
    background-color: #1976d2;
    color: black;
    font-weight: 500;
    color: white;
  }
  input[type='radio'] {
    display: none;
  }
  label {
    flex-grow: 1;
    border-radius: 4px;
    transition:
      background-color,
      400ms ease-in-out,
      color 400ms ease-in-out;
    background-color: #ccd7e6;
    font-weight: 500;
    text-align: center;
    :hover {
      background-color: var(--color3);
    }
  }
`;
const PaymentOption = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  gap: 1em;
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
  padding: 0.6em 0 0;
  gap: 0.8em;
`;
const PaymentInfo = styled.div`
  display: grid;
  padding: 0 0.4em;
  gap: 1em;
  grid-template-columns: 1fr 0.7fr;
`;

const Wrapper = styled.span`
  display: flex;
  justify-content: space-between;
`;

const Label = styled.span`
  display: flex;
  justify-content: space-between;
  font-weight: 500;
  font-size: 14px;
`;
