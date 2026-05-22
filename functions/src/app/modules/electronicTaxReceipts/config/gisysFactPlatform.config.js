import { db } from '../../../core/config/firebase.js';

export const GISYS_FACT_PLATFORM_CONFIG_PATH = 'platformConfig/gisysFact';

export const getGisysFactPlatformConfig = async () => {
  const snap = await db.doc(GISYS_FACT_PLATFORM_CONFIG_PATH).get();
  return snap.exists ? snap.data() || {} : {};
};
