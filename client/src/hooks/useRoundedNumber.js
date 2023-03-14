import { useState, useEffect } from 'react';

export function useRoundedNumber(initialValue, precision) {
  const [roundedValue, setRoundedValue] = useState();

  useEffect(() => {
    setRoundedValue(Number(initialValue).toFixed(2));
  }, [initialValue]);

  return Number(roundedValue);
}
