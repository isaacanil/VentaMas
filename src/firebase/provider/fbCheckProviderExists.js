import { collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '../firebaseconfig';

export const fbCheckProviderExists = async (
  businessID,
  rnc,
  name,
  currentProviderId = null,
) => {
  const providersRef = collection(db, 'businesses', businessID, 'providers');

  // Check for RNC
  const rncQuery = query(providersRef, where('provider.rnc', '==', rnc));
  const rncSnapshot = await getDocs(rncQuery);

  // Check for name (case insensitive)
  const nameQuery = query(providersRef, where('provider.name', '==', name));
  const nameSnapshot = await getDocs(nameQuery);

  const duplicates = {
    rnc: false,
    name: false,
  };

  rncSnapshot.forEach((doc) => {
    if (doc.data().provider.id !== currentProviderId) {
      duplicates.rnc = true;
    }
  });

  nameSnapshot.forEach((doc) => {
    if (doc.data().provider.id !== currentProviderId) {
      duplicates.name = true;
    }
  });

  return duplicates;
};
