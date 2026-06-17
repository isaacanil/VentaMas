import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormInstance } from 'antd';

import supabase from '@/supabase/config';

import {
  fetchRncRecordByNumber,
  getRncSearchErrorMessage,
  useRncSearch,
} from './useRncSearch';

vi.mock('@/supabase/config', () => ({
  default: {
    from: vi.fn(),
  },
}));

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));

describe('useRncSearch helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.from).mockReturnValue({
      select,
    } as never);

    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });
  });

  it('returns null when the RNC does not exist', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(fetchRncRecordByNumber('101026042')).resolves.toBeNull();
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it('returns the matched RNC record when it exists', async () => {
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
  });

  it('preserves specific error messages for the UI', () => {
    expect(
      getRncSearchErrorMessage(
        new Error('No se encontraron resultados para el número ingresado.'),
      ),
    ).toBe('No se encontraron resultados para el número ingresado.');
  });

  it('keeps consultarRNC stable across rerenders with the same form', () => {
    const form = {
      setFieldsValue: vi.fn(),
      getFieldsValue: vi.fn(() => ({})),
    } as unknown as FormInstance;

    const { result, rerender } = renderHook(() => useRncSearch(form));
    const firstConsultarRNC = result.current.consultarRNC;

    rerender();

    expect(result.current.consultarRNC).toBe(firstConsultarRNC);
  });
});
