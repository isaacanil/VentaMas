import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { fbGetClient } from '@/firebase/client/fbGetClient';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';

export const useListenAccountsReceivable = (
  user,
  dateRange = null,
  statusFilter = 'active',
) => {
  const [accountsReceivable, setAccountsReceivable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.businessID) {
      setAccountsReceivable([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const accountsReceivableCollection = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable',
    );

    const constraints = [orderBy('createdAt', 'desc')];

    if (statusFilter !== 'all') {
      const includeActive = statusFilter === 'active';
      constraints.unshift(where('isActive', '==', includeActive));
    }

    if (dateRange && dateRange.startDate && dateRange.endDate) {
      constraints.push(
        where('createdAt', '>=', new Date(dateRange.startDate)),
        where('createdAt', '<=', new Date(dateRange.endDate)),
      );
    }

    const q = query(accountsReceivableCollection, ...constraints);

    const cacheClients = {};
    const cacheInvoices = {};

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const accountsPromises = querySnapshot.docs.map(async (docSnap) => {
          const account = docSnap.data() || {};
          const accountId = account.id || docSnap.id;

          const clientId = account.clientId;
          const invoiceId = account.invoiceId;

          const clientDataPromise =
            clientId && cacheClients[clientId]
              ? Promise.resolve(cacheClients[clientId])
              : clientId
              ? fbGetClient(user, clientId)
              : Promise.resolve(null);

          const invoiceDataPromise =
            invoiceId && cacheInvoices[invoiceId]
              ? Promise.resolve(cacheInvoices[invoiceId])
              : invoiceId
              ? fbGetInvoice(user.businessID, invoiceId)
              : Promise.resolve(null);

          const [clientData, invoiceData] = await Promise.all([
            clientDataPromise,
            invoiceDataPromise,
          ]);

          if (clientId) cacheClients[clientId] = clientData;
          if (invoiceId) cacheInvoices[invoiceId] = invoiceData;

          return {
            id: accountId,
            lastPaymentDate: account.lastPaymentDate,
            balance: account.arBalance,
            initialAmountAr: account.totalReceivable,
            createdAt: account.createdAt,
            account: account,
            client: clientData || { id: clientId, error: true },
            invoice: invoiceData || { id: invoiceId, error: true },
          };
        });

        const accounts = await Promise.all(accountsPromises);

        setAccountsReceivable((prevAccounts) => {
          const isEqual =
            JSON.stringify(prevAccounts) === JSON.stringify(accounts);
          if (!isEqual) {
            return accounts;
          }
          return prevAccounts;
        });
      } catch (error) {
        console.error('Error listening accounts receivable:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, dateRange, statusFilter]);

  return { accountsReceivable, loading };
};
