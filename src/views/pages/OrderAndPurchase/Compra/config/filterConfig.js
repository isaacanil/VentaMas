import { faTruck, faMoneyBill } from '@fortawesome/free-solid-svg-icons';

import { transactionConditions } from '@/constants/orderAndPurchaseState';

const createFilterConfig = () => ({
  filters: [
    {
      type: 'select',
      key: 'condition',
      placeholder: 'Condiciones',
      allowClear: true,
      icon: faMoneyBill,
      options: transactionConditions.map((c) => ({
        value: c.id,
        label: c.label,
        icon: c.icon,
      })),
    },
    {
      type: 'status',
      key: 'status',
      visibleStatus: ['pending', 'completed', 'canceled', 'processing'],
      placeholder: 'Estado',
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
    status: 'pending',
    providerId: null,
    condition: null,
  },
  defaultSort: {
    isAscending: false,
  },
  showSortButton: true,
  showResetButton: true,
});

export default createFilterConfig;
