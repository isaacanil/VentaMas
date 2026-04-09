import { describe, expect, it } from 'vitest';

import {
  areOnlyNonBlockingFailures,
  buildNonBlockingFailureSummary,
  summarizeOutboxTasks,
} from './failurePolicy.service.js';

describe('failurePolicy.service', () => {
  it('normaliza docs de outbox, recorta strings y descarta tareas sin tipo', () => {
    expect(
      summarizeOutboxTasks([
        {
          id: 'task-1',
          data: () => ({
            type: ' attachToCashCount ',
            status: ' failed ',
            lastError: ' cash locked ',
          }),
        },
        {
          id: 'task-2',
          type: '   ',
          status: 'failed',
        },
      ]),
    ).toEqual([
      {
        id: 'task-1',
        type: 'attachToCashCount',
        status: 'failed',
        lastError: 'cash locked',
      },
    ]);
  });

  it('solo considera no bloqueantes cuando todas las tareas fallidas son de ese tipo', () => {
    expect(
      areOnlyNonBlockingFailures([
        {
          type: 'attachToCashCount',
          status: 'failed',
        },
      ]),
    ).toBe(true);

    expect(
      areOnlyNonBlockingFailures([
        {
          type: 'attachToCashCount',
          status: 'failed',
        },
        {
          type: 'updateInventory',
          status: 'failed',
        },
      ]),
    ).toBe(false);

    expect(areOnlyNonBlockingFailures([])).toBe(false);
  });

  it('resume tipos unicos, errores y si requiere revision de caja', () => {
    expect(
      buildNonBlockingFailureSummary([
        {
          id: 'task-1',
          type: 'attachToCashCount',
          lastError: 'cash locked',
        },
        {
          id: 'task-2',
          type: 'attachToCashCount',
          lastError: 'cash locked again',
        },
      ]),
    ).toEqual({
      taskTypes: ['attachToCashCount'],
      taskErrors: [
        {
          type: 'attachToCashCount',
          lastError: 'cash locked',
        },
        {
          type: 'attachToCashCount',
          lastError: 'cash locked again',
        },
      ],
      requiresCashCountReview: true,
    });
  });
});
