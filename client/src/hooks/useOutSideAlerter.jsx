import React, { useRef, useEffect } from 'react'

export const useOutSideAlerter = (ref, executedWhenIsTrue, fn) => {
    useEffect(() => {
        if(executedWhenIsTrue) {
            
            const handleClickOutSide = (e) => {
                if (ref.current && !ref.current.contains(e.target)) {
                    //alert('click outside')
                    fn()
                }
            }
            document.addEventListener('mousedown', handleClickOutSide);
            return () => {
                document.removeEventListener('mousedown', handleClickOutSide)
            }
        }
    }, [ref])
}