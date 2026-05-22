import { HttpsError } from 'firebase-functions/v2/https';

import { ROLE } from '../../../core/constants/roles.constants.js';
import { getUserAccessProfile } from '../../../versions/v2/invoice/services/repairTasks.service.js';

export const assertElectronicTaxReceiptDeveloperAccess = async (authUid) => {
  const profile = await getUserAccessProfile(authUid);
  if (!profile.userSnap?.exists || profile.rootRole !== ROLE.DEV) {
    throw new HttpsError(
      'permission-denied',
      'Solo desarrolladores pueden administrar el enlace e-CF GISYS.',
    );
  }
};
