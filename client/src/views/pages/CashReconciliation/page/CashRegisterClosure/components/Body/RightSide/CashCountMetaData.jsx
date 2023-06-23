import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectCashCount, setClosingCashTotalAndDiscrepancy } from '../../../../../../../../features/cashCount/cashCountSlide';

export const CashCountMetaData = (cashCount) => {
  
   if(!cashCount){return null}
   
    const {sales, opening, closing} = cashCount;
    const totalOpeningBanknotes = opening.banknotesTotal;
    const totalClosingBanknotes = closing.banknotesTotal;
   
    let totalCard = sales.reduce((total, sale) => {
      return total + (sale.data.paymentMethod.filter(payment => payment.method === "card" && payment.status).length > 0 ? sale.data.totalPurchase.value : 0);
    }, 0);
  
    let totalTransfer = sales.reduce((total, sale) => {
      return total + (sale.data.paymentMethod.filter(payment => payment.method === "transfer" && payment.status).length > 0 ? sale.data.totalPurchase.value : 0);
    }, 0);
  
    const totalRegister = totalClosingBanknotes + totalOpeningBanknotes + totalCard + totalTransfer;
    const totalCharged = sales.reduce((total, sale) => {
      return total + sale?.data?.totalPurchase?.value;
    }, 0);

    const totalSystem = totalCharged + totalOpeningBanknotes;

    const totalDiscrepancy = totalRegister - totalSystem;
   
  return {
    totalCard,
    totalTransfer,
    totalRegister,
    totalSystem,
    totalDiscrepancy,
    totalCharged
    
  }
}
