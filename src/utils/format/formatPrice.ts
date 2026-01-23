import { monetarySymbols } from '@/constants/monetarySymbols';
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
