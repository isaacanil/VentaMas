import { describe, expect, it, vi } from 'vitest';

import {
  RNC_LOOKUP_SOURCES,
  createRncLookupRepository,
  createStorageSqliteRncRepository,
  createUnavailableRncRepository,
  isRncRepositoryUnavailableError,
} from './rncRepository.js';

describe('rncRepository adapters', () => {
  it('defaults to the storage-sqlite repository', async () => {
    const repository = createRncLookupRepository({ env: {} });

    expect(repository.source).toBe(RNC_LOOKUP_SOURCES.STORAGE_SQLITE);
    expect(repository.currentManifestPath).toBe('rnc/current.json');
    expect(repository.objectPath).toBe('rnc.sqlite.gz');
  });

  it('can be explicitly disabled', async () => {
    const repository = createRncLookupRepository({
      env: {
        RNC_LOOKUP_SOURCE: 'unavailable',
      },
    });

    expect(repository.source).toBe(RNC_LOOKUP_SOURCES.UNAVAILABLE);
    await expect(repository.findByRnc('101026042')).rejects.toMatchObject({
      code: 'rnc-repository-unavailable',
      details: {
        reason: 'explicitly-disabled',
        source: RNC_LOOKUP_SOURCES.UNAVAILABLE,
      },
    });
  });

  it('builds the storage-sqlite adapter without querying fake data', async () => {
    const repository = createRncLookupRepository({
      env: {
        RNC_LOOKUP_SOURCE: 'storage-sqlite',
        RNC_CURRENT_MANIFEST_PATH: 'rnc/current.json',
        RNC_SQLITE_BUCKET: 'dgii-bucket',
        RNC_SQLITE_CACHE_TTL_MS: '600000',
        RNC_SQLITE_STORAGE_PATH: 'catalogs/rnc.sqlite.gz',
      },
    });

    expect(repository).toMatchObject({
      bucketName: 'dgii-bucket',
      currentManifestPath: 'rnc/current.json',
      objectPath: 'catalogs/rnc.sqlite.gz',
      source: RNC_LOOKUP_SOURCES.STORAGE_SQLITE,
    });
  });

  it('delegates storage-sqlite lookups to the SQLite repository', async () => {
    const get = vi.fn(() => ({
      full_name: 'EMPRESA DEMO',
      rnc_number: '101026042',
    }));
    const prepare = vi.fn(() => ({
      get,
    }));
    const repository = createStorageSqliteRncRepository({
      database: {
        prepare,
      },
      objectPath: 'rnc.sqlite.gz',
    });

    await expect(repository.findByRnc('101026042')).resolves.toEqual({
      full_name: 'EMPRESA DEMO',
      rnc_number: '101026042',
    });
    expect(prepare.mock.calls[0][0]).toContain(
      'SELECT "rnc_number", "full_name"',
    );
    expect(prepare.mock.calls[0][0]).not.toContain('SELECT *');
    expect(get).toHaveBeenCalledWith('101026042');
  });

  it('marks repository-unavailable errors by instance or code', async () => {
    const unavailable = createUnavailableRncRepository();

    await expect(unavailable.findByRnc('101026042')).rejects.toSatisfy(
      isRncRepositoryUnavailableError,
    );
    expect(
      isRncRepositoryUnavailableError({
        code: 'rnc-repository-unavailable',
      }),
    ).toBe(true);
  });
});
