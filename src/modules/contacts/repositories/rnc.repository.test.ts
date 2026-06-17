import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient, eq, from, maybeSingle, select } = vi.hoisted(() => {
  const hoistedMaybeSingle = vi.fn();
  const hoistedEq = vi.fn(() => ({ maybeSingle: hoistedMaybeSingle }));
  const hoistedSelect = vi.fn(() => ({ eq: hoistedEq }));
  const hoistedFrom = vi.fn(() => ({ select: hoistedSelect }));

  return {
    createClient: vi.fn(() => ({ from: hoistedFrom })),
    eq: hoistedEq,
    from: hoistedFrom,
    maybeSingle: hoistedMaybeSingle,
    select: hoistedSelect,
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient,
}));

import { fetchRncRecordByNumber } from './rnc.repository';

describe('rnc.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries the RNC table by number', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Demo',
      },
      error: null,
    });

    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Demo',
    });

    expect(from).toHaveBeenCalledWith('rnc');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('rnc_number', '101026042');
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it('returns null when the RNC does not exist', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(fetchRncRecordByNumber('101026042')).resolves.toBeNull();
  });

  it('propagates Supabase errors', async () => {
    const supabaseError = new Error('Supabase unavailable');
    maybeSingle.mockResolvedValue({
      data: null,
      error: supabaseError,
    });

    await expect(fetchRncRecordByNumber('101026042')).rejects.toBe(
      supabaseError,
    );
  });
});
