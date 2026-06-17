import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  notificationMock,
  requestDevAssignSubscriptionMock,
  requestDevDeletePlanCatalogDefinitionMock,
  requestDevListPlanCatalogMock,
  requestDevPreviewPlanCatalogImpactMock,
  requestDevPublishPlanCatalogVersionMock,
  requestDevRecordPaymentHistoryItemMock,
  requestDevUpdatePlanCatalogLifecycleMock,
  requestDevUpsertPlanCatalogDefinitionMock,
  requestDevUpsertPlanCatalogVersionMock,
} = vi.hoisted(() => ({
  notificationMock: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  requestDevAssignSubscriptionMock: vi.fn(),
  requestDevDeletePlanCatalogDefinitionMock: vi.fn(),
  requestDevListPlanCatalogMock: vi.fn(),
  requestDevPreviewPlanCatalogImpactMock: vi.fn(),
  requestDevPublishPlanCatalogVersionMock: vi.fn(),
  requestDevRecordPaymentHistoryItemMock: vi.fn(),
  requestDevUpdatePlanCatalogLifecycleMock: vi.fn(),
  requestDevUpsertPlanCatalogDefinitionMock: vi.fn(),
  requestDevUpsertPlanCatalogVersionMock: vi.fn(),
}));

vi.mock('antd', () => ({
  notification: notificationMock,
}));

vi.mock('@/firebase/billing/billingManagement', () => ({
  requestDevAssignSubscription: (...args: unknown[]) =>
    requestDevAssignSubscriptionMock(...args),
  requestDevDeletePlanCatalogDefinition: (...args: unknown[]) =>
    requestDevDeletePlanCatalogDefinitionMock(...args),
  requestDevListPlanCatalog: (...args: unknown[]) =>
    requestDevListPlanCatalogMock(...args),
  requestDevPreviewPlanCatalogImpact: (...args: unknown[]) =>
    requestDevPreviewPlanCatalogImpactMock(...args),
  requestDevPublishPlanCatalogVersion: (...args: unknown[]) =>
    requestDevPublishPlanCatalogVersionMock(...args),
  requestDevRecordPaymentHistoryItem: (...args: unknown[]) =>
    requestDevRecordPaymentHistoryItemMock(...args),
  requestDevUpdatePlanCatalogLifecycle: (...args: unknown[]) =>
    requestDevUpdatePlanCatalogLifecycleMock(...args),
  requestDevUpsertPlanCatalogDefinition: (...args: unknown[]) =>
    requestDevUpsertPlanCatalogDefinitionMock(...args),
  requestDevUpsertPlanCatalogVersion: (...args: unknown[]) =>
    requestDevUpsertPlanCatalogVersionMock(...args),
}));

import { useDeveloperTools } from './useDeveloperTools';

describe('useDeveloperTools', () => {
  beforeEach(() => {
    notificationMock.error.mockReset();
    notificationMock.success.mockReset();
    notificationMock.warning.mockReset();
    requestDevAssignSubscriptionMock.mockReset();
    requestDevDeletePlanCatalogDefinitionMock.mockReset();
    requestDevListPlanCatalogMock.mockReset();
    requestDevPreviewPlanCatalogImpactMock.mockReset();
    requestDevPublishPlanCatalogVersionMock.mockReset();
    requestDevRecordPaymentHistoryItemMock.mockReset();
    requestDevUpdatePlanCatalogLifecycleMock.mockReset();
    requestDevUpsertPlanCatalogDefinitionMock.mockReset();
    requestDevUpsertPlanCatalogVersionMock.mockReset();
  });

  it('limpia devBusy y busyAction cuando aplicar ahora se bloquea por impacto', async () => {
    requestDevPreviewPlanCatalogImpactMock.mockResolvedValue({
      totals: {
        businessesBlocked: 1,
      },
    });

    const handleLoadOverview = vi.fn();
    const { result } = renderHook(() =>
      useDeveloperTools(true, 'business-1', null, handleLoadOverview),
    );

    await act(async () => {
      await result.current.handleApplyVersionNow();
    });

    expect(result.current.devBusy).toBe(false);
    expect(result.current.busyAction).toBeNull();
    expect(notificationMock.warning).toHaveBeenCalledWith({
      message: 'Cambios bloqueados por impacto',
      description:
        'El preflight detectó violaciones en negocios existentes. Corrige los límites antes de aplicar.',
    });
    expect(requestDevUpsertPlanCatalogVersionMock).not.toHaveBeenCalled();
    expect(requestDevPublishPlanCatalogVersionMock).not.toHaveBeenCalled();
    expect(handleLoadOverview).not.toHaveBeenCalled();
  });
});
