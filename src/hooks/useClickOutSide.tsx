import { useEffect, type RefObject } from 'react';

export const useClickOutSide = (
  ref: RefObject<HTMLElement>,
  executedWhenIsTrue: boolean,
  fn: () => void,
  eventType: keyof DocumentEventMap = 'mousedown',
) => {
  useEffect(() => {
    if (executedWhenIsTrue && ref.current && fn) {
      const handleClickOutSide = (e: MouseEvent | TouchEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          fn();
        }
      };
      document.addEventListener(eventType as any, handleClickOutSide);
      return () => {
        document.removeEventListener(eventType as any, handleClickOutSide);
      };
    }
  }, [ref, executedWhenIsTrue, fn, eventType]);
};
