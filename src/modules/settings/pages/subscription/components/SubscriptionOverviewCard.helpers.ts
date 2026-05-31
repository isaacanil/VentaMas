import {
  faBox,
  faBuilding,
  faCartShopping,
  faDesktop,
  faFileLines,
  faTruck,
  faUserCheck,
  faUsers,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';

const LIMIT_ICON_MAP: Record<string, typeof faBuilding> = {
  maxBusinesses: faBuilding,
  maxUsers: faUsers,
  maxProducts: faBox,
  maxMonthlyInvoices: faFileLines,
  maxClients: faUserCheck,
  maxSuppliers: faTruck,
  maxWarehouses: faWarehouse,
  maxOpenCashRegisters: faCartShopping,
};

export const resolveLimitIcon = (key: string) =>
  LIMIT_ICON_MAP[key] || faDesktop;

export const resolveStatusTone = (
  status: string | null,
): 'active' | 'warning' | 'danger' => {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'scheduled' || status === 'past_due' || status === 'none') {
    return 'warning';
  }
  return 'danger';
};

export const resolveDaysRemaining = (periodEnd: number | null) => {
  if (!periodEnd) return null;
  return Math.max(0, Math.ceil((periodEnd - Date.now()) / 86_400_000));
};
