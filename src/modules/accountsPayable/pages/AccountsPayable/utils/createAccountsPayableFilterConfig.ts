import {
  faMoneyBill,
  faShieldAlt,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';

import { transactionConditions } from '@/constants/orderAndPurchaseState';
import type { FilterConfigState } from '@/modules/orderAndPurchase/public';

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
    {
      type: 'select',
      key: 'paymentControlStatus',
      placeholder: 'Control',
      allowClear: true,
      icon: faShieldAlt,
      options: [
        { value: 'payable', label: 'Aprobadas' },
        { value: 'pending_approval', label: 'Pendientes aprobación' },
        { value: 'on_hold', label: 'Retenidas' },
        { value: 'disputed', label: 'En disputa' },
      ],
    },
  ],
  defaultValues: {
    providerId: null,
    condition: null,
    paymentControlStatus: null,
  },
  defaultSort: {
    isAscending: true,
  },
  showSortButton: true,
  showResetButton: true,
});

export default createAccountsPayableFilterConfig;
