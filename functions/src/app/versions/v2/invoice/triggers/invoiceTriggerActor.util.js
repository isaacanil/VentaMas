const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const resolveInvoiceTriggerActorUid = ({
  invoice,
  payload,
  logger,
  context = {},
} = {}) => {
  const invoiceUserId = toCleanString(invoice?.userId);
  const payloadUserId = toCleanString(payload?.userId);

  if (invoiceUserId && payloadUserId && invoiceUserId !== payloadUserId) {
    logger?.warn?.('Invoice trigger payload userId differs from invoice userId', {
      ...context,
      invoiceUserId,
      payloadUserId,
    });
  }

  return invoiceUserId || payloadUserId || null;
};
