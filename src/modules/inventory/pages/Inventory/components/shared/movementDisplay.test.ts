import { describe, expect, it } from 'vitest';

import { MovementReason, MovementType } from '@/models/Warehouse/Movement';

import {
  formatInventoryMovementReason,
  getExternalInventoryMovementLocationText,
  getInventoryMovementLocationDisplay,
  getMovementReasonBadgeStyles,
} from './movementDisplay';

describe('movementDisplay', () => {
  it('formats known and unknown movement reasons', () => {
    expect(formatInventoryMovementReason(MovementReason.Purchase)).toBe(
      'Compra',
    );
    expect(formatInventoryMovementReason(MovementReason.Transfer)).toBe(
      'Transferencia',
    );
    expect(formatInventoryMovementReason('legacy_reason')).toBe(
      'Desconocido',
    );
    expect(formatInventoryMovementReason(null)).toBe('Desconocido');
  });

  it('returns distinct badge styles for known and fallback reasons', () => {
    expect(getMovementReasonBadgeStyles(MovementReason.Sale)).toContain(
      '#388E3C',
    );
    expect(getMovementReasonBadgeStyles(MovementReason.Damaged)).toContain(
      '#D32F2F',
    );
    expect(getMovementReasonBadgeStyles('legacy_reason')).toContain('#757575');
  });

  it('uses inventory loss text for damaged, expired, lost, and other reasons', () => {
    expect(
      getInventoryMovementLocationDisplay({
        movementReason: MovementReason.Damaged,
        movementType: MovementType.Exit,
      }),
    ).toBe('Baja de Inventario');
    expect(
      getExternalInventoryMovementLocationText({
        movementReason: 'other',
        movementType: MovementType.Exit,
      }),
    ).toBe('Baja de Inventario');
  });

  it('resolves adjustment locations while ignoring invalid placeholders', () => {
    expect(
      getInventoryMovementLocationDisplay({
        destinationLocation: 'warehouse-1',
        destinationLocationName: 'Almacén Principal',
        movementReason: MovementReason.Adjustment,
        movementType: MovementType.In,
        sourceLocation: 'adjustment',
        sourceLocationName: 'N/A',
      }),
    ).toBe('Almacén Principal');
    expect(
      getInventoryMovementLocationDisplay({
        destinationLocation: 'adjustment',
        destinationLocationName: 'Ubicación no encontrada',
        movementReason: MovementReason.Adjustment,
        movementType: MovementType.In,
        sourceLocation: 'adjustment',
        sourceLocationName: 'N/A',
      }),
    ).toBe('Ajuste de Inventario');
  });

  it('falls back to external labels when movement location is missing or invalid', () => {
    expect(
      getInventoryMovementLocationDisplay({
        movementReason: MovementReason.Purchase,
        movementType: MovementType.In,
      }),
    ).toBe('Proveedor Externo');
    expect(
      getInventoryMovementLocationDisplay({
        destinationLocation: 'warehouse-1',
        destinationLocationName: 'Error resolviendo ubicación',
        movementReason: MovementReason.Sale,
        movementType: MovementType.Exit,
      }),
    ).toBe('Cliente');
  });
});
