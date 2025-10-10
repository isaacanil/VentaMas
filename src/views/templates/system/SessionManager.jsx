import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../features/auth/userSlice';
import { useAutomaticLogin } from '../../../firebase/Auth/fbAuthV2/fbSignIn/checkSession';

import VentamaxLoader from './loader/GenericLoader';

export const SessionManager = () => {
    const user = useSelector(selectUser);
    useAutomaticLogin();

    const MIN_TIME = 1200;
    const MAX_TIME = 8000;

    const [loaderVisible, setLoaderVisible] = useState(true);
    const startTimeRef = useRef(Date.now());
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // If user is loaded, check if minimum time has passed
        if (user) {
            const elapsedTime = Date.now() - startTimeRef.current;
            const remainingTime = Math.max(0, MIN_TIME - elapsedTime);
            
            timeoutRef.current = setTimeout(() => {
                setLoaderVisible(false);
            }, remainingTime);
        } else {
            // If no user after max time, hide loader anyway
            timeoutRef.current = setTimeout(() => {
                setLoaderVisible(false);
            }, MAX_TIME);
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user, MIN_TIME, MAX_TIME]);

    const handleLoaderFinish = () => setLoaderVisible(false);

    return (
        <>
            {loaderVisible && <VentamaxLoader onFinish={handleLoaderFinish} />}
        </>
    )

};