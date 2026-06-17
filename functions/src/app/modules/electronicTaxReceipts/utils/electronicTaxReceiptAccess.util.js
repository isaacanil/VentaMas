import { HttpsError } from 'firebase-functions/v2/https';

import { ROLE } from '../../../core/constants/roles.constants.js';
import { getUserAccessProfile } from '../../../versions/v2/auth/services/userAccess.service.js';

export const assertElectronicTaxReceiptDeveloperAccess = async (
  authUid,
  {
    permissionDeniedMessage = 'Solo desarrolladores pueden administrar el enlace e-CF GISYS.',
  } = {},
) => {
  const profile = await getUserAccessProfile(authUid);
  if (!profile.userSnap?.exists || profile.rootRole !== ROLE.DEV) {
    throw new HttpsError(
      'permission-denied',
      permissionDeniedMessage,
    );
  }
};
