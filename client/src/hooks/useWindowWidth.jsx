import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [isWindowWide, setIsWindowWide] = useState(window.innerWidth > 800);

  useEffect(() => {
    const handleResize = () => {
      setIsWindowWide(window.innerWidth > 800);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isWindowWide;
}
