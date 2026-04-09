import { monetarySymbols } from '@/constants/monetarySymbols';
import type { SupportedDocumentCurrency } from '@/types/products';
import { separator, type NumberInput } from '@/utils/number/number';

export type FormatPriceSymbol =
  | 'rd'
  | 'euro'
  | 'pound'
  | ''
  | typeof monetarySymbols.dollarSign
  | typeof monetarySymbols.euroSign
  | typeof monetarySymbols.poundSign
  | typeof monetarySymbols.rd;

export const formatPrice = (
  value: NumberInput,
  symbol: FormatPriceSymbol = monetarySymbols.dollarSign,
): string => {
  switch (symbol) {
    case 'rd':
      return `${monetarySymbols.rd}${separator(value)}`;
    case 'euro':
      return `${monetarySymbols.euroSign}${separator(value)}`;
    case 'pound':
      return `${monetarySymbols.poundSign}${separator(value)}`;
    default:
      return `${symbol}${separator(value)}`;
  }
};

export const getPriceSymbolByCurrency = (
  currency: SupportedDocumentCurrency = 'DOP',
): FormatPriceSymbol => {
  switch (currency) {
    case 'USD':
      return monetarySymbols.dollarSign;
    case 'EUR':
      return monetarySymbols.euroSign;
    default:
      return monetarySymbols.rd;
  }
};

export const formatPriceByCurrency = (
  value: NumberInput,
  currency: SupportedDocumentCurrency = 'DOP',
): string => formatPrice(value, getPriceSymbolByCurrency(currency));
