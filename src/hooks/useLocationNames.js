import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import { getLocationName } from '../firebase/warehouse/locationService';

const locationCache = new Map();

export const useLocationNames = () => {
    const user = useSelector(selectUser);
    const [locationNames, setLocationNames] = useState({});

    const getLocationNameCached = useCallback(async (locationId) => {
        if (!locationId) return 'N/A';
        
        // Revisar caché primero
        if (locationCache.has(locationId)) {
            return locationCache.get(locationId);
        }

        try {
            const name = await getLocationName(user, locationId);
            // Guardar en caché
            locationCache.set(locationId, name);
            return name;
        } catch (error) {
            console.error('Error fetching location name:', error);
            return 'Error';
        }
    }, [user]);

    const fetchLocationName = useCallback(async (locationId) => {
        if (!locationNames[locationId]) { // Verificar antes de pedir
            const name = await getLocationNameCached(locationId);
            setLocationNames(prev => ({
                ...prev,
                [locationId]: name
            }));
        }
    }, [getLocationNameCached, locationNames]);

    return { locationNames, fetchLocationName };
};
