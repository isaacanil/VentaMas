
export const CashCountMetaData = (cashCount, invoices = []) => {
  
   if(!cashCount){return null}
   
    const {sales, opening, closing} = cashCount;
    const totalOpeningBanknotes = opening.banknotesTotal;
    const totalClosingBanknotes = closing.banknotesTotal;
 
    // let totalCard = invoices.reduce((total, sale) => {
    //   return total + (sale.data.paymentMethod.filter(payment => payment.method === "card" && payment.status).length > 0 ? sale.data.totalPurchase.value : 0);
    // }, 0);
    const totalCard = invoices.reduce((total, factura) => {
      const { paymentMethod, payment } = factura.data;
      const tarjeta = paymentMethod.find(method => method.method === 'card' && method.status === true);
      if (tarjeta) {
        return total + payment.value;
      }
      return total;
    }, 0);

    let totalTransfer = invoices.reduce((total, sale) => {
      return total + (sale.data.paymentMethod.filter(payment => payment.method === "transfer" && payment.status).length > 0 ? sale.data.totalPurchase.value : 0);
    }, 0);
    
    const totalRegister = totalClosingBanknotes  + totalCard + totalTransfer;
    
    const totalCharged = invoices.reduce((total, sale) => { 
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
