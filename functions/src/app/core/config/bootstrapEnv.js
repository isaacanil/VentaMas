const resolveProjectId = () => {
  const direct =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.PROJECT_ID ||
    null;
  if (direct && typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (!firebaseConfig || typeof firebaseConfig !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(firebaseConfig);
    const projectId =
      parsed?.projectId || parsed?.project_id || parsed?.PROJECT_ID || null;
    if (projectId && typeof projectId === 'string' && projectId.trim()) {
      return projectId.trim();
    }
  } catch (err) {
    console.warn('[bootstrap-env] Invalid FIREBASE_CONFIG JSON:', err);
  }

  return null;
};

const projectId = resolveProjectId();
if (projectId && !process.env.GCLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = projectId;
}
