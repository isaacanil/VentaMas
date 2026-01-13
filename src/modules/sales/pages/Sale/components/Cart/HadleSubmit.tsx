import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

export const HandleSubmit = () => {
  const bill = useSelector((state: { cart: unknown }) => state.cart);
  const componentRef = useRef<HTMLDivElement | null>(null);

  const triggerPrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleSubmit = useCallback(async () => {
    if (!triggerPrint) return;
    await triggerPrint();
  }, [triggerPrint]);

  return { bill, handleSubmit, componentRef };
};
