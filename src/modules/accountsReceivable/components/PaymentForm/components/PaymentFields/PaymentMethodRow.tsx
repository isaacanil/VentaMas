import { Checkbox, Input, InputNumber } from 'antd';
import type { InputNumberRef } from '@rc-component/input-number';
import React from 'react';

import { formatNumber } from '@/utils/formatNumber';

import { CheckboxContainer, FormItem, Row } from './styles';

type AccountsReceivablePaymentMethod = {
  method: string;
  value: number;
  status: boolean;
  reference?: string | null;
  bankAccountId?: string | null;
};

type PaymentInfo = {
  label: string;
  icon: React.ReactNode;
};

type PaymentFieldKey = 'status' | 'value' | 'reference' | 'bankAccountId';

interface PaymentMethodRowProps {
  paymentMethod: AccountsReceivablePaymentMethod;
  paymentInfo: Record<string, PaymentInfo>;
  errors: Record<string, string>;
  cashInputRef: React.RefObject<InputNumberRef | null>;
  showBankAccountField?: boolean;
  bankAccountLabel?: string;
  onInputChange: (
    method: string,
    key: PaymentFieldKey,
    value: boolean | number | string | null,
  ) => void;
}

export const PaymentMethodRow = ({
  paymentMethod,
  paymentInfo,
  errors,
  cashInputRef,
  showBankAccountField = false,
  bankAccountLabel,
  onInputChange,
}: PaymentMethodRowProps) => {
  const amountInput = (
    <InputNumber
      addonBefore={paymentInfo[paymentMethod.method]?.icon}
      placeholder="$$$"
      value={paymentMethod.value}
      disabled={!paymentMethod.status}
      onChange={(value) => onInputChange(paymentMethod.method, 'value', value)}
      min={0}
      precision={2}
      step={0.01}
      formatter={formatNumber}
      parser={(value) => (value ? value.replace(/,/g, '') : '')}
      style={{ width: '100%' }}
      ref={paymentMethod.method === 'cash' ? cashInputRef : undefined}
    />
  );

  return (
    <Row key={paymentMethod.method}>
      <CheckboxContainer>
        <Checkbox
          checked={paymentMethod.status}
          onChange={(event) =>
            onInputChange(paymentMethod.method, 'status', event.target.checked)
          }
        />
      </CheckboxContainer>
      <FormItem
        label={paymentInfo[paymentMethod.method]?.label}
        validateStatus={errors[`${paymentMethod.method}_value`] ? 'error' : ''}
        help={errors[`${paymentMethod.method}_value`]}
      >
        {amountInput}
      </FormItem>
      {paymentMethod.reference !== undefined && (
        <FormItem
          label="Referencia"
          validateStatus={
            errors[`${paymentMethod.method}_reference`] ? 'error' : ''
          }
          help={errors[`${paymentMethod.method}_reference`]}
        >
          <Input
            placeholder="Referencia"
            value={paymentMethod.reference || ''}
            disabled={!paymentMethod.status}
            onChange={(e) =>
              onInputChange(paymentMethod.method, 'reference', e.target.value)
            }
          />
        </FormItem>
      )}
      {showBankAccountField ? (
        <FormItem label="Cuenta bancaria">
          <Input
            disabled
            value={bankAccountLabel || 'Sin cuenta bancaria configurada'}
          />
        </FormItem>
      ) : null}
    </Row>
  );
};
