import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectBusinessData } from '@/features/auth/businessSlice';
import {
  setFiscalTaxationSettings,
  type FiscalTaxationPayload,
} from '@/features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { resolveBusinessFiscalTaxationPolicy } from '@/utils/fiscal/fiscalRollout';

export const useBusinessFiscalSync = () => {
  const dispatch = useDispatch();
  const business = useSelector(selectBusinessData);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  useEffect(() => {
    const policy = resolveBusinessFiscalTaxationPolicy({
      business,
      taxReceiptEnabled,
    });

    const payload: FiscalTaxationPayload = {
      enabled: policy.taxationEnabled,
      source: policy.source,
    };

    dispatch(setFiscalTaxationSettings(payload));
  }, [business, dispatch, taxReceiptEnabled]);
};
