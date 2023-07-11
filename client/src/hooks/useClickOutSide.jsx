import React, { useRef, useEffect } from 'react'
export const useClickOutSide = (ref, executedWhenIsTrue, fn, eventType = 'mousedown') => {
    useEffect(() => {
        if(executedWhenIsTrue && ref.current) {
            const handleClickOutSide = (e) => {
                if (!ref.current.contains(e.target)) {
                    fn();
                }
            };
            document.addEventListener(eventType, handleClickOutSide);
            return () => {
                document.removeEventListener(eventType, handleClickOutSide);
            };
        }
    }, [ref, executedWhenIsTrue, fn, eventType]);
}