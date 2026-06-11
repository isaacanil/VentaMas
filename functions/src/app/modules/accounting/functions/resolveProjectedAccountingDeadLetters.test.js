import { describe, expect, it } from 'vitest';

import {
  planDeadLetterResolution,
  resolveJournalEntryIdForDeadLetter,
} from '../../../../../scripts/resolveProjectedAccountingDeadLetters.js';

describe('resolveProjectedAccountingDeadLetters planner', () => {
  it('marks a dead letter resolved when the event already has a journal entry', () => {
    const plan = planDeadLetterResolution({
      accountingEvent: {
        projection: {
          status: 'projected',
          journalEntryId: 'journal-1',
        },
      },
      deadLetter: {
        id: 'event-1',
        eventId: 'event-1',
        projectionStatus: 'failed',
      },
      journalEntryExists: true,
      now: 'now',
      resolvedBy: 'test',
    });

    expect(plan).toMatchObject({
      journalEntryId: 'journal-1',
      reason: 'journal_entry_exists',
      shouldResolve: true,
    });
    expect(plan.patch).toMatchObject({
      projectionStatus: 'resolved',
      retryable: false,
      resolvedAt: 'now',
      resolvedBy: 'test',
      resolution: {
        journalEntryId: 'journal-1',
        previousProjectionStatus: 'failed',
        reason: 'journal_entry_exists',
      },
    });
  });

  it('does not mark a dead letter resolved when the journal entry is missing', () => {
    const plan = planDeadLetterResolution({
      accountingEvent: {
        projection: {
          status: 'projected',
          journalEntryId: 'journal-1',
        },
      },
      deadLetter: {
        id: 'event-1',
        eventId: 'event-1',
        projectionStatus: 'failed',
      },
      journalEntryExists: false,
    });

    expect(plan).toMatchObject({
      journalEntryId: 'journal-1',
      reason: 'journal_entry_missing',
      shouldResolve: false,
    });
  });

  it('falls back to the event id only when linked journal entry fields are absent', () => {
    expect(
      resolveJournalEntryIdForDeadLetter({
        accountingEvent: {
          projection: {},
        },
        deadLetter: {
          eventId: 'event-1',
        },
      }),
    ).toBe('event-1');
  });
});
