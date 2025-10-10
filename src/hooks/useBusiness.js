import { useSelector } from 'react-redux';

import { selectBusinessData } from '../features/auth/businessSlice';

/**
 * Custom hook to access and check business properties
 * @returns {Object} Object with business data and helper properties
 */
const useBusiness = () => {
    const business = useSelector(selectBusinessData);
    const businessType = business?.businessType || '';
    
    return {
        // Business raw data
        data: business,
        businessType,
        businessName: business?.name || '',
        
        // Type checks
        isPharmacy: businessType === 'pharmacy',
        
        // Feature flags based on business configuration
        hasInsurance: !!business?.features?.insurance,
        hasInventory: !!business?.features?.inventory,
        hasMultipleWarehouses: !!business?.features?.multipleWarehouses,
        hasDelivery: !!business?.features?.delivery,
        
        // Helper method to check any business type
        isBusinessType: (type) => businessType === type
    };
};

export default useBusiness;