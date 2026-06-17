import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../modules/warehouse/services/defaultWarehouse.service.js', () => ({
  ensureDefaultWarehouse: vi.fn(),
  getDefaultWarehouse: vi.fn(),
}));

import {
  ensureDefaultWarehouse as canonicalEnsureDefaultWarehouse,
  getDefaultWarehouse as canonicalGetDefaultWarehouse,
} from '../../../../../modules/warehouse/services/defaultWarehouse.service.js';
import {
  ensureDefaultWarehouse,
  getDefaultWarehouse,
} from './warehouse.service.js';

describe('v1 warehouse.service shim', () => {
  it('re-exports the canonical default warehouse service contract', () => {
    expect(getDefaultWarehouse).toBe(canonicalGetDefaultWarehouse);
    expect(ensureDefaultWarehouse).toBe(canonicalEnsureDefaultWarehouse);
  });
});
