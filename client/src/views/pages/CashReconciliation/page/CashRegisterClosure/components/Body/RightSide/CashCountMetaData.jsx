
function getBankNotesTotal(bankNotes = []) {
  const totals = bankNotes.reduce((total, bankNote) => {
    return total + (bankNote.value * bankNote.quantity)
  }, 0)
  return totals
}
/**
 * Calculates and returns metadata for cash count.
 * @param {Array} invoices - The array of invoices.
 * @param {Object} cashCount - The cash count object.
 * @returns {Object} - The metadata object containing various totals.
 */
export const CashCountMetaData = (cashCount, invoices = []) => {

  if (!cashCount) { return null }

  const { sales, opening, closing } = cashCount;

  const totalOpeningBanknotes = getBankNotesTotal(opening.banknotes);
  // const totalClosingBanknotes = closing.banknotesTotal;
  const totalClosingBanknotes = getBankNotesTotal(closing.banknotes)
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

  const totalRegister = totalClosingBanknotes + totalCard + totalTransfer;

  const totalCharged = invoices.reduce((total, sale) => {
    return total + sale?.data?.totalPurchase?.value;
  }, 0);

  const totalSystem = totalCharged + totalOpeningBanknotes;

  const totalDiscrepancy = totalRegister - totalSystem;

  return {
    totalCard: totalCard || 0,
    totalTransfer: totalTransfer || 0,
    totalRegister: totalRegister || 0,
    totalSystem: totalSystem || 0,
    totalDiscrepancy: totalDiscrepancy || 0,
    totalCharged: totalCharged || 0
  }
}
