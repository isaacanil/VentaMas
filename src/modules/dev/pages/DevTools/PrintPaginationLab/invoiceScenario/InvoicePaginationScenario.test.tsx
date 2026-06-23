import { describe, expect, it } from 'vitest';

import { buildInvoicePaginationScenario } from './InvoicePaginationScenario';
import {
  buildInvoiceScenarioData,
  INVOICE_SCENARIO_PRESETS,
  type InvoiceScenarioPresetId,
} from './invoiceScenarioFixtures';

const collectBlockIds = (presetId: InvoiceScenarioPresetId) =>
  buildInvoicePaginationScenario({ presetId }).blocks.map((block) => block.id);

describe('invoice pagination lab scenario', () => {
  it('keeps every fixture preset mapped to atomic row blocks plus a final summary', () => {
    INVOICE_SCENARIO_PRESETS.forEach((preset) => {
      const data = buildInvoiceScenarioData(preset.id);
      const scenario = buildInvoicePaginationScenario({ presetId: preset.id });
      const productCount = data.products?.length ?? 0;
      const productBlockIds = scenario.blocks
        .map((block) => block.id)
        .filter((id) => id.startsWith('invoice-row-'));

      expect(productBlockIds).toHaveLength(productCount);
      expect(scenario.blocks.at(-1)?.id).toBe('invoice-summary');
      expect(new Set(scenario.blocks.map((block) => block.id)).size).toBe(
        scenario.blocks.length,
      );
      expect(scenario.totalLabel).toMatch(/RD\$|DOP/);
    });
  });

  it('keeps preset sizes deterministic for visual QA cases', () => {
    expect(collectBlockIds('short')).toHaveLength(4);
    expect(collectBlockIds('twoPages')).toHaveLength(11);
    expect(collectBlockIds('long')).toHaveLength(45);
    expect(collectBlockIds('electronic')).toHaveLength(29);
    expect(collectBlockIds('largeSummary')).toHaveLength(34);
  });

  it('preserves electronic invoice data in the e-CF fixture', () => {
    const scenario = buildInvoicePaginationScenario({ presetId: 'electronic' });

    expect(scenario.data.electronicTaxReceipt?.eNcf).toBe('E310000000123');
    expect(scenario.data.electronicTaxReceipt?.securityCode).toBe('A1B2C3');
    expect(scenario.data.NCF).toBe('E310000000123');
  });

  it('inserts an identifiable overflow block without losing product rows', () => {
    const baseScenario = buildInvoicePaginationScenario({
      presetId: 'twoPages',
    });
    const overflowScenario = buildInvoicePaginationScenario({
      includeOverflowBlock: true,
      presetId: 'twoPages',
    });

    expect(overflowScenario.blocks.map((block) => block.id)).toContain(
      'invoice-overflow-block',
    );
    expect(overflowScenario.blocks).toHaveLength(baseScenario.blocks.length + 1);
    expect(overflowScenario.blocks.at(-1)?.id).toBe('invoice-summary');
  });
});
