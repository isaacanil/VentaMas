import { normalizedIncludes } from '@/utils/searchText';

export const getSelectOptionText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  if (Array.isArray(value)) {
    return value.map(getSelectOptionText).filter(Boolean).join(' ');
  }

  return '';
};

export const matchesSelectOptionText = (
  inputValue: string,
  optionText: unknown,
) => normalizedIncludes(getSelectOptionText(optionText), inputValue);
