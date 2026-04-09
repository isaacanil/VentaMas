import { message } from 'antd';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  resolveAccountingEntryTarget,
  type AccountingEntryTargetSource,
} from '@/modules/accounting/utils/accountingNavigation';

export const useOpenAccountingEntry = () => {
  const navigate = useNavigate();

  return useCallback(
    (source: AccountingEntryTargetSource | null | undefined) => {
      const target = resolveAccountingEntryTarget(source);
      if (!target) {
        message.info(
          'Este documento todavia no tiene un asiento contable navegable.',
        );
        return false;
      }

      navigate(target.route);
      return true;
    },
    [navigate],
  );
};
