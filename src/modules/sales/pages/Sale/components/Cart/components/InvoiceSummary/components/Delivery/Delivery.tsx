import { Checkbox, InputNumber } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { InputNumberRef } from '@rc-component/input-number';
import React, { useRef } from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectClient,
  setClient,
} from '@/features/clientCart/clientCartSlice';
import { Label, LineItem } from '@/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.styles';

type DeliveryInfo = {
  status?: boolean;
  value?: number;
};

type ClientInfo = {
  delivery?: DeliveryInfo;
};

type DeliveryProps = {
  inputWidth?: string;
};



export const Delivery = ({
  inputWidth = '170px',
}: DeliveryProps) => {
  const dispatch = useDispatch();
  const deliveryStatusInput = useRef<InputNumberRef | null>(null);
  const client = useSelector(selectClient) as ClientInfo | null;

  useEffect(() => {
    if (client?.delivery?.status && deliveryStatusInput.current) {
      // Enfocar el input cuando el estado de delivery es verdadero
      deliveryStatusInput.current.focus();
    }
  }, [client?.delivery?.status]);
  const updateClientStatus = (e: CheckboxChangeEvent) => {
    const value = e.target.checked;
    dispatch(
      setClient({
        ...client,
        delivery: {
          ...client.delivery,
          status: value,
        },
      }),
    );
  };
  const updateClient = (value: number | null) => {
    dispatch(
      setClient({
        ...client,
        delivery: {
          ...client.delivery,
          value: Number(value),
        },
      }),
    );
  };

  return (
    <LineItem>
      <Label htmlFor="delivery">Delivery:</Label>
      <span
        style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          alignItems: 'center',
          gap: '0.2em',
        }}
      >
        <Checkbox
          id="delivery"
          checked={client?.delivery?.status}
          onChange={(e) => updateClientStatus(e)}
        />
        <InputNumber
          value={client?.delivery?.value ?? null}
          ref={deliveryStatusInput}
          placeholder="0"
          prefix="$"
          style={{ width: inputWidth }}
          min={0}
          disabled={!client?.delivery?.status}
          onChange={(e) => updateClient(e)}
        />
      </span>
    </LineItem>
  );
};




