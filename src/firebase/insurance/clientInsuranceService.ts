import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

type UserWithBusiness = {
  businessID: string;
};

export type ClientInsuranceData = Record<string, unknown> & {
  id?: string;
  clientId?: string;
};

export async function createClientInsurance(
  user: UserWithBusiness,
  insuranceData: ClientInsuranceData,
): Promise<boolean> {
  try {
    const id = nanoid();
    const insuranceRef = doc(
      db,
      'businesses',
      user.businessID,
      'clientInsurance',
      id,
    );

    await setDoc(insuranceRef, { id, ...insuranceData });

    return true;
  } catch (error) {
    console.error('Error creating client insurance:', error);
    return false;
  }
}

export async function updateClientInsurance(
  user: UserWithBusiness,
  insuranceData: ClientInsuranceData & { id: string },
): Promise<boolean> {
  try {
    const insuranceRef = doc(
      db,
      'businesses',
      user.businessID,
      'clientInsurance',
      insuranceData.id,
    );

    await setDoc(insuranceRef, { ...insuranceData }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error updating client insurance:', error);
    return false;
  }
}

export async function getClientInsuranceByClientId(
  user: UserWithBusiness | null | undefined,
  clientId: string,
): Promise<ClientInsuranceData | null> {
  try {
    if (!user?.businessID || !clientId) {
      return null;
    }

    const insuranceRef = collection(
      db,
      'businesses',
      user.businessID,
      'clientInsurance',
    );
    const q = query(insuranceRef, where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Devolver el primer registro que coincide (asumiendo que un cliente tiene un seguro)
    return querySnapshot.docs[0].data() as ClientInsuranceData;
  } catch (error) {
    console.error('Error fetching client insurance:', error);
    return null;
  }
}
