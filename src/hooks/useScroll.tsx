import { useState, useEffect, type RefObject } from 'react';

const useScroll = (ref: RefObject<HTMLElement>) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const element = ref.current;

    const handleScroll = () => {
      if (element && element.scrollTop >= 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    if (element) {
      element.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [ref]);

  return isScrolled;
};

export default useScroll;
