import { faTruck, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import type { UserIdentity } from '@/types/users';

interface UserOptionSource {
  user?: UserIdentity & { icon?: React.ReactNode };
}

interface FilterConfigParams {
  users: UserOptionSource[];
}

const createFilterConfig = ({ users }: FilterConfigParams) => ({
  filters: [
    {
      type: 'select',
      key: 'users',
      placeholder: 'Usuarios',
      allowClear: true,
      icon: faMoneyBill,
      options: users.map(({ user }) => ({
        value: user?.id || user?.uid || '',
        label: user?.realName?.trim() ? user.realName : user?.name || 'Sin nombre',
        icon: user?.icon,
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
    condition: null,
  },
  defaultSort: {
    isAscending: false,
  },
  showSortButton: true,
  showResetButton: true,
});

export default createFilterConfig;
