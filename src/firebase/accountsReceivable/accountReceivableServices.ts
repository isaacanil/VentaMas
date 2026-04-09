import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { fbGetClient } from '@/firebase/client/fbGetClient';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDateRange,
  AccountsReceivableDoc,
  AccountsReceivableRecord,
  AccountsReceivableStatusFilter,
  ReceivableClient,
  ReceivableInvoice,
} from '@/utils/accountsReceivable/types';

export const useListenAccountsReceivable = (
  user: UserIdentity | null | undefined,
  dateRange: AccountsReceivableDateRange | null = null,
  statusFilter: AccountsReceivableStatusFilter = 'active',
): { accountsReceivable: AccountsReceivableRecord[]; loading: boolean } => {
  const [accountsReceivable, setAccountsReceivable] = useState<
    AccountsReceivableRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const businessID = user?.businessID ?? null;
  const rangeStart = dateRange?.startDate ?? null;
  const rangeEnd = dateRange?.endDate ?? null;

  useEffect(() => {
    if (!businessID) {
      setAccountsReceivable([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const accountsReceivableCollection = collection(
      db,
      'businesses',
      businessID,
      'accountsReceivable',
    );

    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (statusFilter !== 'all') {
      const includeActive = statusFilter === 'active';
      constraints.unshift(where('isActive', '==', includeActive));
    }

    if (rangeStart !== null && rangeEnd !== null) {
      constraints.push(
        where('createdAt', '>=', new Date(rangeStart)),
        where('createdAt', '<=', new Date(rangeEnd)),
      );
    }

    const q = query(accountsReceivableCollection, ...constraints);

    const cacheClients: Record<string, ReceivableClient | null> = {};
    const cacheInvoices: Record<string, ReceivableInvoice | null> = {};

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        try {
          const accountsPromises = querySnapshot.docs.map(async (docSnap) => {
            const account = (docSnap.data() || {}) as AccountsReceivableDoc;
            const accountId = account.id || docSnap.id;

            const clientId = account.clientId;
            const invoiceId = account.invoiceId;

            const clientDataPromise =
              clientId && clientId in cacheClients
                ? Promise.resolve(cacheClients[clientId])
                : clientId
                  ? fbGetClient({ businessID }, clientId)
                  : Promise.resolve(null);

            const invoiceDataPromise =
              invoiceId && invoiceId in cacheInvoices
                ? Promise.resolve(cacheInvoices[invoiceId])
                : invoiceId
                  ? fbGetInvoice(businessID, invoiceId)
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
            } as AccountsReceivableRecord;
          });

          const accounts = await Promise.all(accountsPromises);

          if (!isMounted) return;

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
          if (isMounted) setLoading(false);
        }
      },
      (error) => {
        console.error('Accounts receivable snapshot error:', error);
        if (isMounted) setLoading(false);
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [businessID, rangeStart, rangeEnd, statusFilter]);

  return { accountsReceivable, loading };
};
