import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { changeValueInvoiceForm } from '../../../../../../../features/invoice/invoiceFormSlice';

import type {
  DiscountType,
  PaymentMethod,
  PaymentInfoProps,
  RootState,
} from '../types';

import { formatPrice} from '@/utils/formatPrice'


interface UsePaymentInfoArgs {
  isEditLocked?: PaymentInfoProps['isEditLocked'];
}

interface PaymentBalance {
  label: string;
  variant: 'positive' | 'negative';
  formatted: string;
}

interface UsePaymentInfoResult {
  paymentMethods: PaymentMethod[];
  readOnly: boolean;
  formattedTotalPurchase: string;
  formattedTotalPayment: string;
  balance: PaymentBalance;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  handleStatusChange: (method: PaymentMethod, status: boolean) => void;
  handleValueChange: (method: PaymentMethod, value: number | null) => void;
  handleReferenceChange: (method: PaymentMethod, reference: string) => void;
  handleDiscountTypeChange: (type: DiscountType) => void;
  handleDiscountValueChange: (value: number | null) => void;
}

const asNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const usePaymentInfo = ({
  isEditLocked,
}: UsePaymentInfoArgs): UsePaymentInfoResult => {
  const dispatch = useDispatch();

  const { invoice } = useSelector((state: RootState) => state.invoiceForm);

  const paymentMethods = invoice?.paymentMethod ?? [];
  const totalPurchase = asNumber(invoice?.totalPurchase?.value);
  const subtotal = asNumber(invoice?.totalPurchaseWithoutTaxes?.value);
  const readOnly = Boolean(isEditLocked);

  const [discountType, setDiscountType] = useState<DiscountType>(
    invoice?.discount?.type ?? 'percentage',
  );

  const totalPayment = useMemo(
    () =>
      paymentMethods.reduce((sum, method) => {
        if (!method?.status) return sum;
        const value = asNumber(method?.value, 0);
        return sum + value;
      }, 0),
    [paymentMethods],
  );

  const changeAmount = useMemo(() => {
    const rawChange = invoice?.change?.value;
    if (rawChange === 0 || rawChange) {
      const parsed = asNumber(rawChange, Number.NaN);
      if (Number.isFinite(parsed)) return parsed;
    }
    return totalPayment - totalPurchase;
  }, [invoice?.change?.value, totalPayment, totalPurchase]);

  const updatePaymentMethods = useCallback(
    (methods: PaymentMethod[]) => {
      if (readOnly) return;

      const sanitized = methods.map((method): PaymentMethod => {
        const normalizedValue = asNumber(method.value, 0);
        const shouldIncludeReference = method.reference !== undefined;
        return {
          ...method,
          value: normalizedValue,
          ...(shouldIncludeReference
            ? { reference: method.reference ?? '' }
            : {}),
        };
      });

      const total = sanitized.reduce((sum, method) => {
        if (!method.status) return sum;
        return sum + asNumber(method.value);
      }, 0);

      dispatch(
        changeValueInvoiceForm({
          invoice: {
            paymentMethod: sanitized,
            payment: {
              value: total,
            },
          },
        }),
      );
    },
    [dispatch, readOnly],
  );

  useEffect(() => {
    if (readOnly) return;
    if (totalPurchase <= 0) return;

    const cashMethod = paymentMethods.find(
      (method) => method.method === 'cash' && method.status,
    );
    if (!cashMethod) return;

    const cashValue = asNumber(cashMethod.value);
    const totalPaymentValue = paymentMethods.reduce((sum, method) => {
      if (!method.status) return sum;
      return sum + asNumber(method.value);
    }, 0);

    if (cashValue === 0 && totalPaymentValue === 0) {
      const updated = paymentMethods.map((method) => {
        if (method.method !== 'cash') return method;
        return {
          ...method,
          value: totalPurchase,
        };
      });

      updatePaymentMethods(updated);
    }
  }, [paymentMethods, totalPurchase, updatePaymentMethods, readOnly]);

  const handleStatusChange = useCallback(
    (method: PaymentMethod, status: boolean) => {
      if (readOnly) return;

      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          status,
          value: status ? item.value : 0,
        };
      });

      if (status) {
        const otherTotal = updated.reduce((sum, item) => {
          if (!item.status || item.method === method.method) return sum;
          return sum + asNumber(item.value);
        }, 0);

        const remaining = Math.max(0, totalPurchase - otherTotal);

        const adjusted = updated.map((item) => {
          if (item.method !== method.method) return item;
          const value = asNumber(item.value, Number.NaN);
          if (Number.isFinite(value) && value > 0) {
            return item;
          }
          return {
            ...item,
            value: remaining,
          };
        });

        updatePaymentMethods(adjusted);
        return;
      }

      updatePaymentMethods(updated);
    },
    [paymentMethods, totalPurchase, updatePaymentMethods, readOnly],
  );

  const handleValueChange = useCallback(
    (method: PaymentMethod, value: number | null) => {
      if (readOnly) return;

      const numericValue = value ?? 0;

      if (numericValue < 0) {
        message.warning(
          'No se permiten montos negativos en los métodos de pago',
        );
      }

      const sanitizedValue = Math.max(
        0,
        Number.isFinite(numericValue) ? numericValue : 0,
      );

      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          value: sanitizedValue,
        };
      });

      updatePaymentMethods(updated);
    },
    [paymentMethods, updatePaymentMethods, readOnly],
  );

  const handleReferenceChange = useCallback(
    (method: PaymentMethod, reference: string) => {
      if (readOnly) return;

      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          reference,
        };
      });

      updatePaymentMethods(updated);
    },
    [paymentMethods, updatePaymentMethods, readOnly],
  );

  const handleDiscountTypeChange = useCallback(
    (type: DiscountType) => {
      if (readOnly) return;

      setDiscountType(type);

      dispatch(
        changeValueInvoiceForm({
          invoice: {
            discount: {
              type,
              value: 0,
            },
          },
        }),
      );
    },
    [dispatch, readOnly],
  );

  const handleDiscountValueChange = useCallback(
    (value: number | null) => {
      if (readOnly) return;

      const numericValue = value ?? 0;

      if (discountType === 'percentage') {
        if (numericValue < 0 || numericValue > 100) {
          message.warning('El descuento porcentual debe estar entre 0 y 100');
          return;
        }
      } else {
        if (numericValue < 0) {
          message.warning('El descuento no puede ser negativo');
          return;
        }
        if (numericValue > subtotal) {
          message.warning('El descuento no puede ser mayor al subtotal');
          return;
        }
      }

      const sanitizedValue = Math.max(
        0,
        Number.isFinite(numericValue) ? numericValue : 0,
      );

      dispatch(
        changeValueInvoiceForm({
          invoice: {
            discount: {
              type: discountType,
              value: sanitizedValue,
            },
          },
        }),
      );
    },
    [dispatch, discountType, subtotal, readOnly],
  );

  useEffect(() => {
    if (invoice?.discount?.type && invoice.discount.type !== discountType) {
      setDiscountType(invoice.discount.type);
    }
  }, [invoice?.discount?.type, discountType]);

  const formattedTotalPayment = useMemo(
    () => formatPrice(totalPayment),
    [totalPayment],
  );

  const formattedTotalPurchase = useMemo(
    () => formatPrice(totalPurchase),
    [totalPurchase],
  );

  const balanceIsPositive = changeAmount >= 0;
  const balanceLabel = balanceIsPositive ? 'Cambio' : 'Pendiente';
  const balanceVariant: PaymentBalance['variant'] = balanceIsPositive
    ? 'positive'
    : 'negative';
  const formattedBalance = useMemo(
    () => formatPrice(Math.abs(changeAmount)),
    [changeAmount],
  );

  return {
    paymentMethods,
    readOnly,
    formattedTotalPurchase,
    formattedTotalPayment,
    balance: {
      label: balanceLabel,
      variant: balanceVariant,
      formatted: formattedBalance,
    },
    discountType,
    discountValue: asNumber(invoice?.discount?.value),
    subtotal,
    handleStatusChange,
    handleValueChange,
    handleReferenceChange,
    handleDiscountTypeChange,
    handleDiscountValueChange,
  };
};
