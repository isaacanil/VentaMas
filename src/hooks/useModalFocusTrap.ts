import { useEffect, type RefObject } from 'react';

type UseModalFocusTrapOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onEscape?: () => void;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex >= 0,
  );

export const useModalFocusTrap = ({
  open,
  containerRef,
  onEscape,
}: UseModalFocusTrapOptions) => {
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const animationFrame = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(container);
      (firstFocusable ?? container).focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleKeyDown);

      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [containerRef, onEscape, open]);
};
