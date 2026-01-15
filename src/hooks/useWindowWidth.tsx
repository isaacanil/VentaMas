import { useState, useEffect } from 'react';

export function useWindowWidth(width = 800): boolean {
  const [isWindowWide, setIsWindowWide] = useState<boolean>(
    () => typeof window !== 'undefined' ? window.innerWidth > width : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsWindowWide(window.innerWidth > width);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width]);

  return isWindowWide;
}
