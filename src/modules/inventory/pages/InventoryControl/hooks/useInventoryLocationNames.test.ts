import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InventoryStockItem } from '@/utils/inventory/types';

const mocks = vi.hoisted(() => ({
  resolveLocationLabel: vi.fn(),
}));

vi.mock('@/firebase/warehouse/locationService', () => ({
  resolveLocationLabel: (...args: unknown[]) =>
    mocks.resolveLocationLabel(...args),
}));

import { useInventoryLocationNames } from './useInventoryLocationNames';

const makeStockItem = (
  id: string,
  item: Partial<InventoryStockItem>,
): InventoryStockItem => ({
  id,
  ...item,
});

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const flushAsyncWork = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useInventoryLocationNames', () => {
  beforeEach(() => {
    mocks.resolveLocationLabel.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deduplica claves normalizadas antes de resolver etiquetas', async () => {
    mocks.resolveLocationLabel.mockImplementation(
      (_businessID: string, key: string): Promise<string> =>
        Promise.resolve(`Nombre ${key}`),
    );

    const { result, unmount } = renderHook(() =>
      useInventoryLocationNames({
        businessID: 'business-1',
        filteredItems: [
          makeStockItem('stock-1', { location: 'warehouse-1/shelf-1' }),
          makeStockItem('stock-2', {
            location:
              'businesses/business-1/warehouses/warehouse-1/shelves/shelf-1',
          }),
          makeStockItem('stock-3', { warehouseId: 'warehouse-2' }),
        ],
      }),
    );

    await waitFor(() =>
      expect(result.current.locationNames).toEqual({
        'warehouse-1/shelf-1': 'Nombre warehouse-1/shelf-1',
        'warehouse-2': 'Nombre warehouse-2',
      }),
    );

    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(2);
    expect(mocks.resolveLocationLabel.mock.calls).toEqual([
      ['business-1', 'warehouse-1/shelf-1'],
      ['business-1', 'warehouse-2'],
    ]);
    expect(result.current.resolvingLocations).toEqual({});

    unmount();
  });

  it('reutiliza solicitudes in-flight y luego usa el cache resuelto', async () => {
    const warehouseLabel = createDeferred<string | null>();
    mocks.resolveLocationLabel.mockReturnValue(warehouseLabel.promise);

    const { result, rerender, unmount } = renderHook(
      ({ filteredItems }: { filteredItems: InventoryStockItem[] }) =>
        useInventoryLocationNames({
          businessID: 'business-1',
          filteredItems,
        }),
      {
        initialProps: {
          filteredItems: [
            makeStockItem('stock-1', { location: 'warehouse-1' }),
          ],
        },
      },
    );

    await waitFor(() =>
      expect(result.current.resolvingLocations).toEqual({
        'warehouse-1': true,
      }),
    );
    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(1);

    rerender({
      filteredItems: [
        makeStockItem('stock-2', {
          location: 'businesses/business-1/warehouses/warehouse-1',
        }),
      ],
    });
    await flushAsyncWork();

    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(1);

    await act(async () => {
      warehouseLabel.resolve('Almacen Principal');
      await warehouseLabel.promise;
    });

    await waitFor(() =>
      expect(result.current.locationNames).toEqual({
        'warehouse-1': 'Almacen Principal',
      }),
    );
    expect(result.current.resolvingLocations).toEqual({});

    rerender({
      filteredItems: [
        makeStockItem('stock-3', { warehouseId: 'warehouse-1' }),
      ],
    });
    await flushAsyncWork();

    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('no reutiliza etiquetas resueltas de otro negocio para la misma ubicacion', async () => {
    const firstBusinessLabel = createDeferred<string | null>();
    const secondBusinessLabel = createDeferred<string | null>();
    mocks.resolveLocationLabel
      .mockReturnValueOnce(firstBusinessLabel.promise)
      .mockReturnValueOnce(secondBusinessLabel.promise);
    const filteredItems = [
      makeStockItem('stock-1', { location: 'warehouse-1' }),
    ];

    const { result, rerender, unmount } = renderHook(
      ({ businessID }: { businessID: string }) =>
        useInventoryLocationNames({
          businessID,
          filteredItems,
        }),
      {
        initialProps: {
          businessID: 'business-1',
        },
      },
    );

    await waitFor(() =>
      expect(mocks.resolveLocationLabel).toHaveBeenCalledWith(
        'business-1',
        'warehouse-1',
      ),
    );

    rerender({ businessID: 'business-2' });

    await waitFor(() =>
      expect(mocks.resolveLocationLabel).toHaveBeenCalledWith(
        'business-2',
        'warehouse-1',
      ),
    );

    await act(async () => {
      firstBusinessLabel.resolve('Almacen negocio 1');
      await firstBusinessLabel.promise;
    });
    await flushAsyncWork();

    expect(result.current.locationNames).toEqual({});

    await act(async () => {
      secondBusinessLabel.resolve('Almacen negocio 2');
      await secondBusinessLabel.promise;
    });

    await waitFor(() =>
      expect(result.current.locationNames).toEqual({
        'warehouse-1': 'Almacen negocio 2',
      }),
    );
    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('limpia resolvingLocations y evita reintentos inmediatos cuando falla la resolucion', async () => {
    const missingLabel = createDeferred<string | null>();
    mocks.resolveLocationLabel.mockReturnValue(missingLabel.promise);

    const { result, rerender, unmount } = renderHook(
      ({ filteredItems }: { filteredItems: InventoryStockItem[] }) =>
        useInventoryLocationNames({
          businessID: 'business-1',
          filteredItems,
        }),
      {
        initialProps: {
          filteredItems: [
            makeStockItem('stock-1', { location: 'warehouse-missing' }),
          ],
        },
      },
    );

    await waitFor(() =>
      expect(result.current.resolvingLocations).toEqual({
        'warehouse-missing': true,
      }),
    );

    await act(async () => {
      missingLabel.resolve(null);
      await missingLabel.promise;
    });

    await waitFor(() => expect(result.current.resolvingLocations).toEqual({}));
    expect(result.current.locationNames).toEqual({});
    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(1);

    rerender({
      filteredItems: [
        makeStockItem('stock-2', { warehouseId: 'warehouse-missing' }),
      ],
    });
    await flushAsyncWork();

    expect(result.current.locationNames).toEqual({});
    expect(result.current.resolvingLocations).toEqual({});
    expect(mocks.resolveLocationLabel).toHaveBeenCalledTimes(1);

    unmount();
  });
});
