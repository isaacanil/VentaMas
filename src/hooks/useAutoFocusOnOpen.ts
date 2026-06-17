import { useEffect, type RefObject } from 'react';

type AutoFocusable = {
  focus?: () => void;
};

type UseAutoFocusOnOpenOptions<TRef extends AutoFocusable> = {
  open: boolean;
  ref: RefObject<TRef | null>;
  delayMs?: number;
};

export const useAutoFocusOnOpen = <TRef extends AutoFocusable>({
  open,
  ref,
  delayMs = 100,
}: UseAutoFocusOnOpenOptions<TRef>) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      ref.current?.focus?.();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, open, ref]);
};
