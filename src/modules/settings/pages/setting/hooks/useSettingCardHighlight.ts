import { useCallback, useEffect, useRef } from 'react';

export const useSettingCardHighlight = () => {
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const highlightTimersRef = useRef<Record<string, number>>({});

  const registerCard = useCallback(
    (settingKey: string, node: HTMLAnchorElement | null) => {
      if (node) {
        cardRefs.current[settingKey] = node;
        return;
      }

      delete cardRefs.current[settingKey];
    },
    [],
  );

  const scrollToCard = useCallback((settingKey: string) => {
    const target = cardRefs.current[settingKey];
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    if (typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }

    target.classList.add('search-highlight');

    if (highlightTimersRef.current[settingKey]) {
      clearTimeout(highlightTimersRef.current[settingKey]);
    }

    highlightTimersRef.current[settingKey] = window.setTimeout(() => {
      target.classList.remove('search-highlight');
      delete highlightTimersRef.current[settingKey];
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(highlightTimersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
      highlightTimersRef.current = {};
    };
  }, []);

  return {
    registerCard,
    scrollToCard,
  };
};
