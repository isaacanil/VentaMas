import { useCallback, useRef } from 'react';

import { batchDOMOperations, performantThrottle } from '../utils/performance/performanceUtils';

/**
 * Custom hook for performant scroll operations that prevents forced reflows
 * @param {React.RefObject} scrollRef - Reference to scrollable element
 * @returns {Object} Scroll utilities
 */
export const usePerformantScroll = (scrollRef) => {
    const scrollMeasurementsCache = useRef({});
    
    // Cache scroll measurements to avoid repeated DOM reads
    const cacheScrollMeasurements = useCallback(() => {
        if (!scrollRef.current) return null;
        
        const element = scrollRef.current;
        const measurements = {
            scrollLeft: element.scrollLeft,
            scrollTop: element.scrollTop,
            scrollWidth: element.scrollWidth,
            scrollHeight: element.scrollHeight,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            timestamp: Date.now()
        };
        
        scrollMeasurementsCache.current = measurements;
        return measurements;
    }, [scrollRef]);
    
    // Get cached measurements or update cache if stale
    const getScrollMeasurements = useCallback(() => {
        const cached = scrollMeasurementsCache.current;
        const isStale = !cached.timestamp || (Date.now() - cached.timestamp) > 16; // 16ms = 1 frame
        
        return isStale ? cacheScrollMeasurements() : cached;
    }, [cacheScrollMeasurements]);
    
    // Smooth scroll to position with batched DOM operations
    const scrollToPosition = useCallback((left = 0, top = 0, behavior = 'smooth') => {
        batchDOMOperations(
            () => getScrollMeasurements(),
            () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({ left, top, behavior });
                }
            }
        );
    }, [scrollRef, getScrollMeasurements]);
    
    // Scroll by delta with batched DOM operations
    const scrollByDelta = useCallback((deltaX = 0, deltaY = 0, behavior = 'smooth') => {
        batchDOMOperations(
            () => getScrollMeasurements(),
            () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollBy({ 
                        left: deltaX, 
                        top: deltaY, 
                        behavior 
                    });
                }
            }
        );
    }, [scrollRef, getScrollMeasurements]);
    
    // Throttled scroll event handler to prevent excessive calls
    const createThrottledScrollHandler = useCallback((handler, limit = 16) => {
        return performantThrottle((event) => {
            const measurements = cacheScrollMeasurements();
            handler(event, measurements);
        }, limit);
    }, [cacheScrollMeasurements]);
    
    // Check if can scroll in a direction without forcing reflow
    const canScroll = useCallback((direction) => {
        const measurements = getScrollMeasurements();
        if (!measurements) return false;
        
        switch (direction) {
            case 'left':
                return measurements.scrollLeft > 0;
            case 'right':
                return measurements.scrollLeft < measurements.scrollWidth - measurements.clientWidth;
            case 'up':
                return measurements.scrollTop > 0;
            case 'down':
                return measurements.scrollTop < measurements.scrollHeight - measurements.clientHeight;
            default:
                return false;
        }
    }, [getScrollMeasurements]);
    
    return {
        scrollToPosition,
        scrollByDelta,
        createThrottledScrollHandler,
        canScroll,
        getScrollMeasurements,
        cacheScrollMeasurements
    };
};
