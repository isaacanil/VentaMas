import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

interface InvoiceDataSnapshot {
  totalPurchasePrice?: number;
  paymentMethod?: string;
}

// Funciones auxiliares para cálculos
const calculateTotalSales = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateTotalCash = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce(
    (sum, inv) =>
      sum + (inv.paymentMethod === 'cash' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalCard = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce(
    (sum, inv) =>
      sum + (inv.paymentMethod === 'card' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalTransfer = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce(
    (sum, inv) =>
      sum +
      (inv.paymentMethod === 'transfer' ? inv.totalPurchasePrice || 0 : 0),
    0,
  );
const calculateTotalFacturado = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateTotalSistema = (invoices: InvoiceDataSnapshot[]) =>
  invoices.reduce((sum, inv) => sum + (inv.totalPurchasePrice || 0), 0);
const calculateSobrante = (
  cash: number,
  card: number,
  transfer: number,
  facturado: number,
  _sistema: number,
) => cash + card + transfer - facturado;

const getInvoices = async (sales: DocumentReference[]) => {
  const invoices = await Promise.all(
    sales.map(async (ref) => {
      const invoiceDoc = await getDoc(ref);
      const invoiceData = invoiceDoc.data() as InvoiceDataSnapshot | undefined;
      return invoiceData || {};
    }),
  );
  return invoices;
};

export const fbRecalculateClosedCashCouts = async (
  user: UserIdentity | null | undefined,
) => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId) return;

  const cashCountsRef = collection(
    db,
    'businesses',
    businessId,
    'cashCounts',
  );
  const q = query(cashCountsRef, where('cashCount.state', '==', 'closed'));
  const querySnapshot = await getDocs(q);

  for (const docSnap of querySnapshot.docs) {
    const cashCountDoc = docSnap.data() as { cashCount?: CashCountRecord };
    const sales = (cashCountDoc.cashCount?.sales || []) as DocumentReference[];
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

    await updateDoc(docSnap.ref, {
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
