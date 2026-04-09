import { faTruck, faMoneyBill } from '@fortawesome/free-solid-svg-icons';

import { transactionConditions } from '@/constants/orderAndPurchaseState';
import type { FilterConfigState } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/FilterBar/types';

const createAccountsPayableFilterConfig = (): FilterConfigState => ({
  filters: [
    {
      type: 'select',
      key: 'condition',
      placeholder: 'Condiciones',
      allowClear: true,
      icon: faMoneyBill,
      options: transactionConditions.map((condition) => ({
        value: condition.id,
        label: condition.label,
        icon: condition.icon,
      })),
    },
    {
      type: 'select',
      key: 'providerId',
      placeholder: 'Proveedores',
      icon: faTruck,
      showSearch: true,
    },
  ],
  defaultValues: {
    status: 'completed',
    providerId: null,
    condition: null,
  },
  defaultSort: {
    isAscending: false,
  },
  showSortButton: true,
  showResetButton: true,
});

export default createAccountsPayableFilterConfig;
