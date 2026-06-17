export { ClientControl } from './components/ClientControl/ClientControl';
export { ClientSelector } from './components/ClientControl/ClientSelector/ClientSelector';
export { Payment } from './pages/Contact/Client/components/ClientForm/components/ClientFinancialInfo/AccountCard/components/Payment';

export const loadClientAdminRoute = () =>
  import('./pages/Contact/Client/ClientAdmin').then((module) => ({
    default: module.ClientAdmin,
  }));

export const loadClientFormModal = () =>
  import('./pages/Contact/Client/components/ClientForm/ClientFormAnt').then(
    (module) => ({ default: module.default }),
  );

export const loadLegacyAddClientModal = () =>
  import('./components/LegacyAddClientModal').then((module) => ({
    default: module.AddClientModal,
  }));

export const loadProviderAdminRoute = () =>
  import('./pages/Contact/Provider/ProviderAdmin').then((module) => ({
    default: module.ProviderAdmin,
  }));

export const loadProviderFormModal = () =>
  import('./pages/Contact/Provider/components/CreateContact/ProviderForm').then(
    (module) => ({ default: module.ProviderForm }),
  );
