import { useState, useEffect } from 'react';

export function useWindowWidth(width = 800, ) {
  const [isWindowWide, setIsWindowWide] = useState(window.innerWidth > 800);

  useEffect(() => {
    const handleResize = () => {
      setIsWindowWide(window.innerWidth > width);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isWindowWide;
}
