import { MovementReason } from '@/models/Warehouse/Movement';

export type MovementReasonType = MovementReason | string | null | undefined;

export type InventoryMovementLocationLike = {
  movementReason?: MovementReasonType;
  movementType?: string | null;
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  sourceLocationName?: string | null;
  destinationLocationName?: string | null;
};

export const getMovementReasonBadgeStyles = (
  reasonType: MovementReasonType,
): string => {
  switch (reasonType) {
    case MovementReason.Purchase:
      return 'background: rgba(25, 118, 210, 0.1); color: #1976D2; border: 1px solid rgba(25, 118, 210, 0.2);';
    case MovementReason.Sale:
      return 'background: rgba(76, 175, 80, 0.1); color: #388E3C; border: 1px solid rgba(76, 175, 80, 0.2);';
    case MovementReason.Adjustment:
      return 'background: rgba(255, 152, 0, 0.1); color: #F57C00; border: 1px solid rgba(255, 152, 0, 0.2);';
    case MovementReason.Return:
      return 'background: rgba(156, 39, 176, 0.1); color: #7B1FA2; border: 1px solid rgba(156, 39, 176, 0.2);';
    case MovementReason.InitialStock:
      return 'background: rgba(0, 150, 136, 0.1); color: #00796B; border: 1px solid rgba(0, 150, 136, 0.2);';
    case MovementReason.Transfer:
      return 'background: rgba(121, 134, 203, 0.1); color: #5C6BC0; border: 1px solid rgba(121, 134, 203, 0.2);';
    case MovementReason.Damaged:
      return 'background: rgba(244, 67, 54, 0.1); color: #D32F2F; border: 1px solid rgba(244, 67, 54, 0.2);';
    case MovementReason.Expired:
      return 'background: rgba(121, 85, 72, 0.1); color: #5D4037; border: 1px solid rgba(121, 85, 72, 0.2);';
    case MovementReason.Lost:
      return 'background: rgba(96, 125, 139, 0.1); color: #455A64; border: 1px solid rgba(96, 125, 139, 0.2);';
    default:
      return 'background: rgba(158, 158, 158, 0.1); color: #757575; border: 1px solid rgba(158, 158, 158, 0.2);';
  }
};

export const formatInventoryMovementReason = (
  reason?: string | null,
): string => {
  const reasonMap: Record<string, string> = {
    purchase: 'Compra',
    sale: 'Venta',
    adjustment: 'Ajuste',
    return: 'Devolución',
    initial_stock: 'Stock Inicial',
    transfer: 'Transferencia',
    damaged: 'Dañado',
    expired: 'Expirado',
    lost: 'Perdido',
    other: 'Otro',
  };

  return reason ? reasonMap[reason] || 'Desconocido' : 'Desconocido';
};

const INVALID_LOCATION_NAME_PATTERN = /Ubicación no encontrada|N\/A|Error/i;
const INVENTORY_LOSS_REASONS = ['damaged', 'expired', 'lost', 'other'];

export const getExternalInventoryMovementLocationText = (
  movement: InventoryMovementLocationLike,
): string => {
  const reason = String(movement.movementReason ?? '');
  if (INVENTORY_LOSS_REASONS.includes(reason)) {
    return 'Baja de Inventario';
  }

  switch (movement.movementReason) {
    case MovementReason.Purchase:
      return 'Proveedor Externo';
    case MovementReason.Sale:
      return 'Cliente';
    case MovementReason.Return:
      return movement.movementType === 'in'
        ? 'Devolución Cliente'
        : 'Devolución Proveedor';
    case MovementReason.InitialStock:
      return 'Inventario Inicial';
    case MovementReason.Adjustment:
      return 'Ajuste de Inventario';
    default:
      return movement.movementType === 'in'
        ? 'Origen Externo'
        : 'Destino Externo';
  }
};

export const getInventoryMovementLocationDisplay = (
  movement: InventoryMovementLocationLike,
): string => {
  const reason = String(movement.movementReason ?? '');
  if (INVENTORY_LOSS_REASONS.includes(reason)) {
    return 'Baja de Inventario';
  }

  if (movement.movementReason === MovementReason.Adjustment) {
    const internalLocationName = [
      movement.sourceLocation === 'adjustment'
        ? null
        : movement.sourceLocationName,
      movement.destinationLocation === 'adjustment'
        ? null
        : movement.destinationLocationName,
    ].find(
      (name) => name && !INVALID_LOCATION_NAME_PATTERN.test(String(name)),
    );
    return internalLocationName || 'Ajuste de Inventario';
  }

  const isEntry = movement.movementType === 'in';
  const locationName = isEntry
    ? movement.sourceLocationName
    : movement.destinationLocationName;
  const location = isEntry
    ? movement.sourceLocation
    : movement.destinationLocation;

  if (
    !location ||
    !locationName ||
    INVALID_LOCATION_NAME_PATTERN.test(String(locationName))
  ) {
    return getExternalInventoryMovementLocationText(movement);
  }

  return locationName || 'Ubicación no encontrada';
};
