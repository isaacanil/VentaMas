import { describe, expect, it } from 'vitest';

import { transactionConditions } from '@/constants/orderAndPurchaseState';

import { createTransactionFilterConfig } from './createTransactionFilterConfig';

describe('createTransactionFilterConfig', () => {
  it('returns the default filter state for transactions', () => {
    const config = createTransactionFilterConfig();

    expect(config.defaultValues).toEqual({
      status: 'pending',
      providerId: null,
      condition: null,
    });
    expect(config.defaultSort).toEqual({ isAscending: false });
    expect(config.showSortButton).toBe(true);
    expect(config.showResetButton).toBe(true);
  });

  it('exposes the visible transaction statuses', () => {
    const statusFilter = createTransactionFilterConfig().filters.find(
      (filter) => filter.key === 'status',
    );

    expect(statusFilter).toMatchObject({
      type: 'status',
      key: 'status',
      placeholder: 'Estado',
      visibleStatus: ['pending', 'completed', 'canceled', 'processing'],
    });
  });

  it('builds condition options from the transaction condition catalog', () => {
    const conditionFilter = createTransactionFilterConfig().filters.find(
      (filter) => filter.key === 'condition',
    );

    expect(conditionFilter).toMatchObject({
      type: 'select',
      key: 'condition',
      placeholder: 'Condiciones',
      allowClear: true,
    });
    expect(conditionFilter?.options).toEqual(
      transactionConditions.map((condition) => ({
        value: condition.id,
        label: condition.label,
        icon: condition.icon,
      })),
    );
  });

  it('enables searchable provider selection', () => {
    const providerFilter = createTransactionFilterConfig().filters.find(
      (filter) => filter.key === 'providerId',
    );

    expect(providerFilter).toMatchObject({
      type: 'select',
      key: 'providerId',
      placeholder: 'Proveedores',
      showSearch: true,
    });
  });

  it('returns fresh mutable config objects for every call', () => {
    const firstConfig = createTransactionFilterConfig();
    const secondConfig = createTransactionFilterConfig();

    expect(secondConfig).not.toBe(firstConfig);
    expect(secondConfig.filters).not.toBe(firstConfig.filters);
    expect(secondConfig.defaultValues).not.toBe(firstConfig.defaultValues);
    expect(secondConfig.defaultSort).not.toBe(firstConfig.defaultSort);

    firstConfig.filters.forEach((filter, index) => {
      const secondFilter = secondConfig.filters[index];

      expect(secondFilter).toBeDefined();
      expect(secondFilter).not.toBe(filter);
      if (filter.options) {
        expect(secondFilter?.options).not.toBe(filter.options);
      }
      if (filter.visibleStatus) {
        expect(secondFilter?.visibleStatus).not.toBe(filter.visibleStatus);
      }
    });
  });
});
