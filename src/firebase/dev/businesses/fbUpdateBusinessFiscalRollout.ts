import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase/firebaseconfig';

export type UpdateBusinessFiscalRolloutRequest = {
  businessId: string;
  reportingEnabled: boolean;
  monthlyComplianceEnabled: boolean;
};

export type UpdateBusinessFiscalRolloutResponse = {
  businessId: string;
  reportingEnabled: boolean;
  monthlyComplianceEnabled: boolean;
};

export const fbUpdateBusinessFiscalRollout = async ({
  businessId,
  reportingEnabled,
  monthlyComplianceEnabled,
}: UpdateBusinessFiscalRolloutRequest): Promise<UpdateBusinessFiscalRolloutResponse> => {
  const cleanBusinessId = businessId.trim();
  if (!cleanBusinessId) {
    throw new Error('businessId es requerido.');
  }

  const businessRef = doc(db, 'businesses', cleanBusinessId);
  await updateDoc(businessRef, {
    'features.fiscal.reportingEnabled': reportingEnabled,
    'features.fiscal.monthlyComplianceEnabled': monthlyComplianceEnabled,
    'features.fiscal.monthlyComplianceUpdatedAt': serverTimestamp(),
    'features.fiscal.monthlyComplianceUpdatedBy': auth.currentUser?.uid ?? null,
  });

  return {
    businessId: cleanBusinessId,
    reportingEnabled,
    monthlyComplianceEnabled,
  };
};
