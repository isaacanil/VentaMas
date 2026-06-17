export interface PaymentMethodBootstrapItem {
  method: string;
  status: boolean;
  value?: number | string | null;
}

export type PaymentMethodBootstrapUpdate<
  TPaymentMethod extends PaymentMethodBootstrapItem,
> = TPaymentMethod & {
  status: true;
  value: number;
};

interface ResolvePaymentMethodBootstrapUpdateArgs<
  TPaymentMethod extends PaymentMethodBootstrapItem,
> {
  isAddedToReceivables: unknown;
  paymentMethods: readonly TPaymentMethod[];
  purchaseTotal: number;
}

interface ResolvePaymentMethodStatusValueArgs<
  TPaymentMethod extends PaymentMethodBootstrapItem,
> {
  method: TPaymentMethod;
  paymentMethods: readonly TPaymentMethod[];
  status: boolean;
  totalPurchase: number;
}

export const resolvePaymentMethodBootstrapUpdate = <
  TPaymentMethod extends PaymentMethodBootstrapItem,
>({
  isAddedToReceivables,
  paymentMethods,
  purchaseTotal,
}: ResolvePaymentMethodBootstrapUpdateArgs<TPaymentMethod>): PaymentMethodBootstrapUpdate<TPaymentMethod> | null => {
  const anyEnabled = paymentMethods.some((method) => method.status);

  if (!anyEnabled) {
    const defaultMethod =
      paymentMethods.find((method) => method.method === 'cash') ??
      paymentMethods[0];

    if (!defaultMethod) {
      return null;
    }

    return {
      ...defaultMethod,
      status: true,
      value: isAddedToReceivables ? 0 : purchaseTotal,
    };
  }

  const totalPaymentValue = paymentMethods.reduce(
    (sum, method) => (method.status ? sum + (Number(method.value) || 0) : sum),
    0,
  );

  if (!isAddedToReceivables && totalPaymentValue === 0 && purchaseTotal > 0) {
    const cashMethod = paymentMethods.find(
      (method) => method.method === 'cash',
    );

    if (cashMethod) {
      return {
        ...cashMethod,
        status: true,
        value: purchaseTotal,
      };
    }
  }

  return null;
};

export const resolvePaymentMethodStatusValue = <
  TPaymentMethod extends PaymentMethodBootstrapItem,
>({
  method,
  paymentMethods,
  status,
  totalPurchase,
}: ResolvePaymentMethodStatusValueArgs<TPaymentMethod>) => {
  if (!status) {
    return 0;
  }

  const currentTotal = paymentMethods.reduce((total, currentMethod) => {
    if (currentMethod.status && currentMethod.method !== method.method) {
      return total + (Number(currentMethod.value) || 0);
    }

    return total;
  }, 0);

  const remaining = totalPurchase - currentTotal;

  return remaining > 0 ? remaining : 0;
};
