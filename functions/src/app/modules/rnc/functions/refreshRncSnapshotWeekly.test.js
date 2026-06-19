import { describe, expect, it, vi } from 'vitest';

const { onScheduleMock, refreshRncSnapshotMock } = vi.hoisted(() => ({
  onScheduleMock: vi.fn((_options, handler) => handler),
  refreshRncSnapshotMock: vi.fn(),
}));

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: (...args) => onScheduleMock(...args),
}));

vi.mock('../services/rncSnapshotRefresh.service.js', () => ({
  refreshRncSnapshot: (...args) => refreshRncSnapshotMock(...args),
}));

import { refreshRncSnapshotWeekly } from './refreshRncSnapshotWeekly.js';

describe('refreshRncSnapshotWeekly', () => {
  it('runs the snapshot refresh service from the scheduler', async () => {
    refreshRncSnapshotMock.mockResolvedValue({
      rowCount: 1,
      skippedRows: 0,
      storagePath: 'rnc.sqlite.gz',
    });

    await refreshRncSnapshotWeekly({
      scheduleTime: '2026-06-22T03:30:00-04:00',
    });

    expect(refreshRncSnapshotMock).toHaveBeenCalledWith({
      trigger: 'daily-scheduler',
    });
    expect(onScheduleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 1,
        maxInstances: 1,
        memory: '4GiB',
        schedule: '30 3 * * *',
        timeoutSeconds: 540,
        timeZone: 'America/Santo_Domingo',
      }),
      expect.any(Function),
    );
  });
});
