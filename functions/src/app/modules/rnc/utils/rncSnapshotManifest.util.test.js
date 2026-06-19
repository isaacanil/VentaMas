import { describe, expect, it } from 'vitest';

import {
  buildVersionedRncManifestPath,
  buildVersionedRncSnapshotPath,
  parseRncCurrentManifest,
  parseRncSnapshotManifest,
  resolveRncCurrentManifestPath,
  resolveRncLegacySqliteStoragePath,
  resolveRncSnapshotManifestPrefix,
  resolveRncSnapshotPrefix,
} from './rncSnapshotManifest.util.js';

const SHA256 = 'a'.repeat(64);

describe('rncSnapshotManifest util', () => {
  it('resolves default manifest and snapshot paths', () => {
    expect(resolveRncCurrentManifestPath({ env: {} })).toBe('rnc/current.json');
    expect(
      resolveRncCurrentManifestPath({
        env: {
          RNC_SNAPSHOT_METADATA_PATH: 'legacy/current.json',
        },
      }),
    ).toBe('legacy/current.json');
    expect(resolveRncSnapshotPrefix({ env: {} })).toBe('rnc/snapshots');
    expect(resolveRncSnapshotManifestPrefix({ env: {} })).toBe('rnc/manifests');
    expect(resolveRncLegacySqliteStoragePath({ env: {} })).toBe('rnc.sqlite.gz');
  });

  it('builds a versioned snapshot path from the gzip SHA-256', () => {
    expect(
      buildVersionedRncSnapshotPath({
        sha256: SHA256.toUpperCase(),
        snapshotPrefix: '/rnc//snapshots/',
      }),
    ).toBe(`rnc/snapshots/${SHA256}.sqlite.gz`);
  });

  it('builds a versioned manifest path from the gzip SHA-256', () => {
    expect(
      buildVersionedRncManifestPath({
        manifestPrefix: '/rnc//manifests/',
        sha256: SHA256.toUpperCase(),
      }),
    ).toBe(`rnc/manifests/${SHA256}.json`);
  });

  it('parses a valid snapshot manifest defensively', () => {
    expect(
      parseRncSnapshotManifest(
        JSON.stringify({
          generatedAt: '2026-06-17T10:00:00.000Z',
          rowCount: 1,
          schemaVersion: 1,
          sha256: SHA256.toUpperCase(),
          snapshotPath: `/rnc/snapshots/${SHA256}.sqlite.gz`,
          source: {
            url: 'https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip',
          },
          sqliteBytes: 1024,
          sqliteGzipBytes: 512,
        }),
      ),
    ).toMatchObject({
      schemaVersion: 1,
      sha256: SHA256,
      snapshotPath: `rnc/snapshots/${SHA256}.sqlite.gz`,
    });
  });

  it('parses a current pointer to a versioned manifest', () => {
    expect(
      parseRncCurrentManifest(
        JSON.stringify({
          activatedAt: '2026-06-17T10:00:00.000Z',
          activationReason: 'publish',
          manifestPath: `rnc/manifests/${SHA256}.json`,
          schemaVersion: 1,
          sha256: SHA256.toUpperCase(),
        }),
      ),
    ).toMatchObject({
      manifestPath: `rnc/manifests/${SHA256}.json`,
      activatedAt: '2026-06-17T10:00:00.000Z',
      activationReason: 'publish',
      schemaVersion: 1,
      sha256: SHA256,
      type: 'snapshot-manifest-pointer',
    });
  });

  it('normalizes legacy current pointer timestamps for compatibility', () => {
    expect(
      parseRncCurrentManifest(
        JSON.stringify({
          manifestPath: `rnc/manifests/${SHA256}.json`,
          publishedAt: '2026-06-17T10:00:00.000Z',
          schemaVersion: 1,
          sha256: SHA256,
        }),
      ),
    ).toMatchObject({
      activatedAt: '2026-06-17T10:00:00.000Z',
      activationReason: 'publish',
      manifestPath: `rnc/manifests/${SHA256}.json`,
      sha256: SHA256,
    });
  });

  it('parses rollback hold and rejected hashes on current pointers', () => {
    const rejectedSha256 = 'b'.repeat(64);

    expect(
      parseRncCurrentManifest(
        JSON.stringify({
          activatedAt: '2026-06-17T10:00:00.000Z',
          activationReason: 'rollback',
          manifestPath: `rnc/manifests/${SHA256}.json`,
          rejectedSha256,
          rollbackHoldUntil: '2026-06-18T10:00:00.000Z',
          schemaVersion: 1,
          sha256: SHA256,
        }),
      ),
    ).toMatchObject({
      activationReason: 'rollback',
      rejectedSha256List: [rejectedSha256],
      rollbackHoldUntil: '2026-06-18T10:00:00.000Z',
    });
  });

  it('keeps parsing legacy current manifests for deployed snapshots', () => {
    expect(
      parseRncCurrentManifest(
        JSON.stringify({
          generatedAt: '2026-06-17T10:00:00.000Z',
          rowCount: 1,
          schemaVersion: 1,
          sha256: SHA256,
          snapshotPath: `rnc/snapshots/${SHA256}.sqlite.gz`,
          source: {
            url: 'https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip',
          },
          sqliteBytes: 1024,
          sqliteGzipBytes: 512,
        }),
      ),
    ).toMatchObject({
      schemaVersion: 1,
      sha256: SHA256,
      snapshotPath: `rnc/snapshots/${SHA256}.sqlite.gz`,
    });
  });

  it('rejects invalid current manifests', () => {
    expect(() =>
      parseRncCurrentManifest(
        JSON.stringify({
          schemaVersion: 2,
          snapshotPath: `rnc/snapshots/${SHA256}.sqlite.gz`,
          sha256: SHA256,
        }),
      ),
    ).toThrow('Manifest RNC current.json invalido.');
  });
});
