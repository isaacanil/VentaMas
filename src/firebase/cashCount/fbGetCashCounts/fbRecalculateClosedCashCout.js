import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../firebaseconfig';

// Funciones auxiliares para cálculos
const calculateTotalSales = (invoices) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateTotalCash = (invoices) =>
  invoices.reduce(
    (sum, inv) =>
      sum + (inv.paymentMethod === 'cash' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalCard = (invoices) =>
  invoices.reduce(
    (sum, inv) =>
      sum + (inv.paymentMethod === 'card' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalTransfer = (invoices) =>
  invoices.reduce(
    (sum, inv) =>
      sum +
      (inv.paymentMethod === 'transfer' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalFacturado = (invoices) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateTotalSistema = (invoices) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateSobrante = (cash, card, transfer, facturado, _sistema) =>
  cash + card + transfer - facturado;

const getInvoices = async (sales) => {
  const invoices = await Promise.all(
    sales.map(async (ref) => {
      const invoiceDoc = await getDoc(ref);
      let invoiceData = invoiceDoc.data();
      invoiceData = {
        ...invoiceData,
      };
      return invoiceData;
    }),
  );
  return invoices;
};

export const fbRecalculateClosedCashCouts = async (user) => {
  const cashCountsRef = collection(
    db,
    'businesses',
    user?.businessID,
    'cashCounts',
  );
  const q = query(cashCountsRef, where('cashCount.state', '==', 'closed'));
  const querySnapshot = await getDocs(q);

  for (const doc of querySnapshot.docs) {
    const cashCount = doc.data();
    const sales = cashCount.sales;
    const invoices = await getInvoices(sales);

    const totalSales = calculateTotalSales(invoices);
    const totalCash = calculateTotalCash(invoices);
    const totalCard = calculateTotalCard(invoices);
    const totalTransfer = calculateTotalTransfer(invoices);
    const totalFacturado = calculateTotalFacturado(invoices);
    const totalSistema = calculateTotalSistema(invoices);
    const sobrante = calculateSobrante(
      totalCash,
      totalCard,
      totalTransfer,
      totalFacturado,
      totalSistema,
    );

    await updateDoc(doc.ref, {
      'cashCount.totalSales': totalSales,
      'cashCount.total': totalCash,
      'cashCount.totalCard': totalCard,
      'cashCount.totalTransfer': totalTransfer,
      'cashCount.totalFacturado': totalFacturado,
      'cashCount.totalSystem': totalSistema,
      'cashCount.discrepancy': sobrante,
    });
  }
};
