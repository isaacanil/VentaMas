import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NavigationContext } from './context';

export const NavigationProvider = ({ children }) => {
    const location = useLocation();
    const [pathHistory, setPathHistory] = useState([]);

    useEffect(() => {
        setPathHistory((prev) => {
            if (prev.length === 0 || prev[prev.length - 1] !== location.pathname) {
                return [...prev, location.pathname].slice(-10);
            }
            return prev;
        });
    }, [location.pathname]);

    const getPreviousPath = (currentPath) => {
        const currentIndex = pathHistory.lastIndexOf(currentPath);
        if (currentIndex > 0) {
            return pathHistory[currentIndex - 1];
        }
        return null;
    };

    const value = {
        pathHistory,
        getPreviousPath,
        currentPath: location.pathname,
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};
