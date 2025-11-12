import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

export const HandleSubmit = () => {
  const bill = useSelector((state) => state.cart);
  const componentRef = useRef(null);

  const triggerPrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleSubmit = useCallback(async () => {
    if (!triggerPrint) return;
    await triggerPrint();
  }, [triggerPrint]);

  return { bill, handleSubmit, componentRef };
};
