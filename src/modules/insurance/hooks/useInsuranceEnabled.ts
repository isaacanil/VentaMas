import { useSelector } from 'react-redux';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectInsuranceEnabled } from '@/features/cart/cartSlice';

/**
 * Custom hook to determine if insurance functionality is enabled
 * Checks both business type and insurance status from cart
 */
export const useIsPharmacy = (): boolean => {
  const business = useSelector(selectBusinessData) as any;
  return business?.businessType === 'pharmacy';
};

const useInsuranceEnabled = (): boolean => {
  const business = useSelector(selectBusinessData) as any;
  const insuranceEnabled = useSelector(selectInsuranceEnabled) as boolean;

  // Only enable insurance for pharmacy businesses and when explicitly enabled in cart
  return business?.businessType === 'pharmacy' && insuranceEnabled;
};

export default useInsuranceEnabled;
