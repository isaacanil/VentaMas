export { default as useInsuranceEnabled } from './hooks/useInsuranceEnabled';
export { useIsPharmacy } from './hooks/useInsuranceEnabled';

export const loadInsuranceConfigRoute = () =>
  import('./pages/Insurance/InsuranceConfig/InsuranceConfig');

export const loadInsuranceCreateRoute = () =>
  import('./pages/Insurance/InsuranceConfigForm/InsuranceConfigForm');
