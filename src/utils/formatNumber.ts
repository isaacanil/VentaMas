
export const formatNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  // Convert string with commas or number to numeric value
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const parsed = parseFloat(value.toString().replace(/\,/g, ''));
    if (isNaN(parsed)) {
      return '';
    }
    num = parsed;
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};