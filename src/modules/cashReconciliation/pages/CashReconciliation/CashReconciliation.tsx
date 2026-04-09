import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { clearCashCount } from '@/features/cashCount/cashCountManagementSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { PageLayout } from '@/components/layout/PageShell';

import { CashReconciliationTable } from './components/Body/CashRecociliationTable';

export const CashReconciliation = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCashCount());
  }, [dispatch]);

  return (
    <PageLayout>
      <MenuApp sectionName={'Cuadre de Caja'} />
      <CashReconciliationTable />
    </PageLayout>
  );
};
