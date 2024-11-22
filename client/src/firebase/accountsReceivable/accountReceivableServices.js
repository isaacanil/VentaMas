import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { fbGetClient } from '../client/fbGetClient';
import { fbGetInvoice } from '../invoices/fbGetInvoice';
import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export const useListenAccountsReceivable = (user, dateRange = null) => {
  const [accountsReceivable, setAccountsReceivable] = useState([]);

  useEffect(() => {
    if (!user || !user.businessID) {
      setAccountsReceivable([]);
      return;
    }

    const accountsReceivableCollection = collection(db, 'businesses', user.businessID, 'accountsReceivable');
    
    let constraints = [where('isActive', '==', true), orderBy('createdAt', 'desc')];
    
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      constraints.push(
        where('createdAt', '>=', new Date(dateRange.startDate)),
        where('createdAt', '<=', new Date(dateRange.endDate))
      );
    }

    const q = query(accountsReceivableCollection, ...constraints);

    const cacheClients = {};
    const cacheInvoices = {};

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      let accounts = [];

      for (const docSnap of querySnapshot.docs) {
        const account = docSnap.data();

        const clientId = account.clientId;
        const invoiceId = account.invoiceId;

        const clientDataPromise = cacheClients[clientId]
          ? Promise.resolve(cacheClients[clientId])
          : fbGetClient(user, clientId);

        const invoiceDataPromise = cacheInvoices[invoiceId]
          ? Promise.resolve(cacheInvoices[invoiceId])
          : fbGetInvoice(user.businessID, invoiceId);

        const [clientData, invoiceData] = await Promise.all([clientDataPromise, invoiceDataPromise]);

        cacheClients[clientId] = clientData;
        cacheInvoices[invoiceId] = invoiceData;

        accounts.push({
          id: account.id,
          lastPaymentDate: account.lastPaymentDate,
          balance: account.arBalance,
          initialAmountAr: account.totalReceivable,
          createdAt: account.createdAt,
          account: account,
          client: clientData || { id: clientId, error: true },
          invoice: invoiceData || { id: invoiceId, error: true },
        });
      }

      setAccountsReceivable(prevAccounts => {
        const isEqual = JSON.stringify(prevAccounts) === JSON.stringify(accounts);
        if (!isEqual) {
          return accounts;
        }
        return prevAccounts;
      });
    });

    return () => unsubscribe();
  }, [user, dateRange]);

  return accountsReceivable;
};