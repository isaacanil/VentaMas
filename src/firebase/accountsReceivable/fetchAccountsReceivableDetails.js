import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { db } from '../firebaseconfig';

async function fetchAccountsReceivableDetails(user, id) {
  if (!user?.businessID) {
    throw new Error('User business ID is missing');
  }

  const accountReceivableRef = doc(
    db,
    `businesses/${user.businessID}/accountsReceivable`,
    id,
  );
  const accountReceivableDoc = await getDoc(accountReceivableRef);

  if (!accountReceivableDoc.exists()) {
    throw new Error('Account Receivable not found');
  }

  const accountReceivableData = accountReceivableDoc.data();

  const fetchRelatedData = async (collectionName, queryField, queryValue) => {
    const collectionRef = collection(
      db,
      `businesses/${user.businessID}/${collectionName}`,
    );
    const dataQuery = query(collectionRef, where(queryField, '==', queryValue));
    const snapshot = await getDocs(dataQuery);
    return snapshot.docs.map((doc) => doc.data());
  };

  const installmentsData = await fetchRelatedData(
    'accountsReceivableInstallments',
    'arId',
    id,
  );
  const installmentPaymentsData = await fetchRelatedData(
    'accountsReceivableInstallmentPayments',
    'arId',
    id,
  );

  const paymentsData = await fetchRelatedData(
    'accountsReceivablePayments',
    'arId',
    id,
  );

  return {
    ar: accountReceivableData,
    installments: installmentsData,
    installmentPayments: installmentPaymentsData,
    payments: paymentsData,
  };
}

export default fetchAccountsReceivableDetails;
