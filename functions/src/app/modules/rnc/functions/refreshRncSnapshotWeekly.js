import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { refreshRncSnapshot } from '../services/rncSnapshotRefresh.service.js';

export const refreshRncSnapshotWeekly = onSchedule(
  {
    schedule: '30 3 * * *',
    timeZone: 'America/Santo_Domingo',
    concurrency: 1,
    maxInstances: 1,
    retryCount: 1,
    timeoutSeconds: 540,
    memory: '4GiB',
  },
  async (event) => {
    const result = await refreshRncSnapshot({
      trigger: 'daily-scheduler',
    });

    logger.info('[refreshRncSnapshotWeekly] completed', {
      scheduleTime: event.scheduleTime,
      rowCount: result.rowCount,
      skipped: result.skipped ?? false,
      skipReason: result.skipReason,
      skippedRows: result.skippedRows,
      storagePath: result.storagePath,
    });
  },
);
