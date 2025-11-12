export function getBackOrderAssociationId({ mode, purchaseId, orderId, operationType }) {
  if (!mode) throw new Error('Mode is required');
  if (mode === 'create') return null;
  if (!purchaseId && operationType === 'purchase') return null;
  if (!orderId && operationType === 'order') return null;

  switch (operationType) {
    case 'purchase':
      return mode === 'convert' ? orderId : purchaseId;
    case 'order':
      return mode === 'update' ? orderId : null;
    default:
      throw new Error(`Invalid operationType: ${operationType}`);
  }
}
