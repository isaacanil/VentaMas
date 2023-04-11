import { useState, useEffect } from "react";

const useScroll = (ref) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current && ref.current.scrollTop >= 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    if (ref.current) {
      ref.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [ref]);

  return isScrolled;
};

export default useScroll;
