export enum MovementType {
  Entry = 'in',
  Exit = 'out',
}

export enum MovementReason {
  Sale = 'sale',
  Purchase = 'purchase',
  Adjustment = 'adjustment',
  Return = 'return',
  InitialStock = 'initial_stock',
  Damaged = 'damaged',
  Expired = 'expired', // Nuevo
  Lost = 'lost',
  Transfer = 'transfer',
  BackOrder = 'backorder',
}
