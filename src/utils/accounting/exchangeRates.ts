import type {
  AccountingManualRatesByCurrency,
  BusinessExchangeRate,
  CurrentExchangeRateIdsByCurrency,
} from '@/types/accounting';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';
import type { TimestampLike } from '@/utils/date/types';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const buildExchangeRateId = ({
  quoteCurrency,
  baseCurrency,
  historyId,
}: {
  quoteCurrency: SupportedDocumentCurrency;
  baseCurrency: SupportedDocumentCurrency;
  historyId: string;
}): string => `fx_${quoteCurrency}_${baseCurrency}_${historyId}`;

export const buildExchangeRateRecordsFromSettings = ({
  businessId,
  functionalCurrency,
  manualRatesByCurrency,
  effectiveAt,
  createdBy,
  historyId,
}: {
  businessId: string;
  functionalCurrency: SupportedDocumentCurrency;
  manualRatesByCurrency: AccountingManualRatesByCurrency;
  effectiveAt: TimestampLike;
  createdBy?: string | null;
  historyId: string;
}): {
  records: BusinessExchangeRate[];
  currentExchangeRateIdsByCurrency: CurrentExchangeRateIdsByCurrency;
} => {
  const records: BusinessExchangeRate[] = [];
  const currentExchangeRateIdsByCurrency: CurrentExchangeRateIdsByCurrency = {};

  Object.entries(manualRatesByCurrency ?? {}).forEach(([currency, rateConfig]) => {
    const quoteCurrency = currency as SupportedDocumentCurrency;
    if (quoteCurrency === functionalCurrency) {
      return;
    }

    const buyRate = Number(rateConfig?.buyRate);
    const sellRate = Number(rateConfig?.sellRate);
    const hasBuyRate = Number.isFinite(buyRate) && buyRate > 0;
    const hasSellRate = Number.isFinite(sellRate) && sellRate > 0;
    if (!hasBuyRate && !hasSellRate) {
      return;
    }

    const id = buildExchangeRateId({
      quoteCurrency,
      baseCurrency: functionalCurrency,
      historyId,
    });

    records.push({
      id,
      businessId,
      quoteCurrency,
      baseCurrency: functionalCurrency,
      buyRate: hasBuyRate ? buyRate : null,
      sellRate: hasSellRate ? sellRate : null,
      effectiveAt,
      source: 'settings_manual',
      status: 'active',
      createdAt: effectiveAt,
      createdBy: toCleanString(createdBy),
      historyId,
      metadata: {
        origin: 'settings/accounting',
      },
    });

    currentExchangeRateIdsByCurrency[quoteCurrency] = id;
  });

  return {
    records,
    currentExchangeRateIdsByCurrency,
  };
};
