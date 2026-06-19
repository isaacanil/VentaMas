import { describe, expect, it, vi } from 'vitest';

import { RncRepositoryUnavailableError } from '../repositories/rncRepository.js';
import {
  lookupRncRecord,
  normalizeRncLookupRecord,
} from './rncLookup.service.js';

const fixedNow = () => new Date('2026-06-17T10:00:00.000Z');

describe('rncLookup.service', () => {
  it('queries the repository with a normalized RNC and returns a DGII-shaped record', async () => {
    const findByRnc = vi.fn(async (rncNumber) => ({
      active: true,
      fullName: 'Empresa Demo',
      metadata: {
        ignored: true,
      },
      rncNumber,
    }));
    const repository = {
      findByRnc,
      getSnapshotMetadata: vi.fn(async () => ({
        lastUpdated: '2026-06-17T00:00:00.000Z',
      })),
      source: 'unit-test',
    };

    const result = await lookupRncRecord({
      now: fixedNow,
      payload: { rnc: '101-02604-2' },
      repository,
    });

    expect(findByRnc).toHaveBeenCalledWith('101026042');
    expect(result).toEqual({
      checkedAt: '2026-06-17T10:00:00.000Z',
      data: {
        active: true,
        fullName: 'Empresa Demo',
        full_name: 'Empresa Demo',
        rncNumber: '101026042',
        rnc_number: '101026042',
      },
      found: true,
      full_name: 'Empresa Demo',
      lastUpdated: '2026-06-17T00:00:00.000Z',
      ok: true,
      record: {
        active: true,
        fullName: 'Empresa Demo',
        full_name: 'Empresa Demo',
        rncNumber: '101026042',
        rnc_number: '101026042',
      },
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'found',
    });
  });

  it('returns not_found_in_contributors_snapshot when the repository has no record', async () => {
    const result = await lookupRncRecord({
      now: fixedNow,
      repository: {
        findByRnc: vi.fn(async () => null),
        source: 'unit-test',
      },
      rnc: '101026042',
    });

    expect(result).toMatchObject({
      data: null,
      found: false,
      lastUpdated: null,
      ok: true,
      record: null,
      rnc_number: '101026042',
      source: 'unit-test',
      status: 'not_found_in_contributors_snapshot',
    });
  });

  it('returns an operational unavailable status for pending adapters', async () => {
    const result = await lookupRncRecord({
      now: fixedNow,
      repository: {
        findByRnc: vi.fn(async () => {
          throw new RncRepositoryUnavailableError('pending', {
            reason: 'sqlite-runtime-pending',
            source: 'storage-sqlite',
          });
        }),
        source: 'storage-sqlite',
      },
      rnc: '101026042',
    });

    expect(result).toEqual({
      checkedAt: '2026-06-17T10:00:00.000Z',
      data: null,
      found: false,
      full_name: null,
      ok: false,
      record: null,
      repository: {
        reason: 'sqlite-runtime-pending',
        source: 'storage-sqlite',
      },
      rnc_number: '101026042',
      source: 'storage-sqlite',
      status: 'unavailable',
    });
  });

  it('normalizes alternate source field names without nested payload leakage', () => {
    expect(
      normalizeRncLookupRecord(
        {
          extra: { nested: true },
          name: 'Proveedor Demo',
          rnc: '101026042',
        },
        '101026042',
      ),
    ).toEqual({
      full_name: 'Proveedor Demo',
      name: 'Proveedor Demo',
      rnc: '101026042',
      rnc_number: '101026042',
    });
  });
});
