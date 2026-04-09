import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { runAccountingEventProjection } from './accountingEventProjection.service.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const projectAccountingEventToJournalEntry = onDocumentCreated(
  {
    document: 'businesses/{businessId}/accountingEvents/{eventId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, eventId } = event.params;
    const accountingEvent = {
      id: eventId,
      ...asRecord(event.data?.data()),
    };
    if (!Object.keys(accountingEvent).length) {
      return null;
    }

    await runAccountingEventProjection({
      businessId,
      eventId,
      accountingEvent,
    });

    return null;
  },
);
