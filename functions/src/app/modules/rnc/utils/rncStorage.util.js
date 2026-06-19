const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parseFirebaseConfig = (env) => {
  const rawConfig = cleanEnvValue(env.FIREBASE_CONFIG);
  if (!rawConfig) return {};

  try {
    return JSON.parse(rawConfig);
  } catch (_error) {
    return {};
  }
};

export const resolveFirebaseProjectId = ({ env = process.env } = {}) => {
  const firebaseConfig = parseFirebaseConfig(env);
  return (
    cleanEnvValue(env.GCLOUD_PROJECT) ??
    cleanEnvValue(env.GCP_PROJECT) ??
    cleanEnvValue(env.FIREBASE_PROJECT_ID) ??
    cleanEnvValue(env.PROJECT_ID) ??
    cleanEnvValue(firebaseConfig.projectId) ??
    null
  );
};

export const resolveRncStorageBucketName = ({ env = process.env } = {}) => {
  const firebaseConfig = parseFirebaseConfig(env);
  const explicitBucket =
    cleanEnvValue(env.RNC_SQLITE_BUCKET) ??
    cleanEnvValue(env.RNC_LOOKUP_SQLITE_BUCKET) ??
    cleanEnvValue(firebaseConfig.storageBucket);

  if (explicitBucket) return explicitBucket;

  const projectId = resolveFirebaseProjectId({ env });
  return projectId ? `${projectId}.firebasestorage.app` : null;
};
