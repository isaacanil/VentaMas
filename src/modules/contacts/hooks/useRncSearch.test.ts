import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormInstance } from 'antd';

import { fetchRncRecordByNumber } from '@/modules/contacts/repositories/rnc.repository';

import { getRncSearchErrorMessage, useRncSearch } from './useRncSearch';

vi.mock('@/modules/contacts/repositories/rnc.repository', () => ({
  fetchRncRecordByNumber: vi.fn(),
}));

describe('useRncSearch helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('uses the contacts RNC repository when consulting DGII data', async () => {
    vi.mocked(fetchRncRecordByNumber).mockResolvedValue({
      rnc_number: '101026042',
      full_name: 'Empresa Demo',
    });
    const form = {
      setFieldsValue: vi.fn(),
      getFieldsValue: vi.fn(() => ({
        rnc: '101026042',
        name: 'Empresa Demo',
      })),
    } as unknown as FormInstance;

    const { result } = renderHook(() => useRncSearch(form));
    await result.current.consultarRNC('101026042');

    expect(fetchRncRecordByNumber).toHaveBeenCalledWith('101026042');
    expect(form.setFieldsValue).toHaveBeenCalledWith({
      rnc: '101026042',
      name: 'Empresa Demo',
    });
  });

});
