import { describe, expect, it } from 'vitest';

import {
  resolveFirebaseProjectId,
  resolveRncStorageBucketName,
} from './rncStorage.util.js';

describe('rncStorage util', () => {
  it('prefers explicit RNC bucket configuration', () => {
    expect(
      resolveRncStorageBucketName({
        env: {
          GCLOUD_PROJECT: 'ventamax-staging',
          RNC_SQLITE_BUCKET: 'custom-rnc-bucket',
        },
      }),
    ).toBe('custom-rnc-bucket');
  });

  it('uses Firebase config storage bucket when available', () => {
    expect(
      resolveRncStorageBucketName({
        env: {
          FIREBASE_CONFIG: JSON.stringify({
            projectId: 'ventamax-staging',
            storageBucket: 'configured-bucket',
          }),
        },
      }),
    ).toBe('configured-bucket');
  });

  it('falls back to the modern Firebase Storage bucket for the project', () => {
    expect(
      resolveRncStorageBucketName({
        env: {
          GCLOUD_PROJECT: 'ventamax-staging',
        },
      }),
    ).toBe('ventamax-staging.firebasestorage.app');
  });

  it('resolves project id from Firebase config', () => {
    expect(
      resolveFirebaseProjectId({
        env: {
          FIREBASE_CONFIG: JSON.stringify({
            projectId: 'ventamax-staging',
          }),
        },
      }),
    ).toBe('ventamax-staging');
  });
});
