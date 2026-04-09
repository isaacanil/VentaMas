type OperationMode =
  | 'create'
  | 'update'
  | 'convert'
  | 'complete'
  | (string & {});
type OperationType = 'purchase' | 'order';

export function getBackOrderAssociationId({
  mode,
  purchaseId,
  orderId,
  operationType,
}: {
  mode: OperationMode;
  purchaseId?: string | null;
  orderId?: string | null;
  operationType: OperationType;
}): string | null {
  if (!mode) throw new Error('Mode is required');
  if (mode === 'create') return null;
  if (!purchaseId && operationType === 'purchase') return null;
  if (!orderId && operationType === 'order') return null;

  switch (operationType) {
    case 'purchase':
      return mode === 'convert' ? (orderId ?? null) : (purchaseId ?? null);
    case 'order':
      return mode === 'update' ? (orderId ?? null) : null;
    default:
      throw new Error(`Invalid operationType: ${operationType}`);
  }
}
