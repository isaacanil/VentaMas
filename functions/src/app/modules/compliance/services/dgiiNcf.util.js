const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed.toUpperCase() : null;
};

export const isValidDgiiNcf = (value) => {
  const ncf = toCleanString(value);
  if (!ncf) return false;

  if (/^B\d{10}$/.test(ncf)) return true;
  if (/^E\d{12}$/.test(ncf)) return true;
  return /^[A-Z0-9]{19}$/.test(ncf);
};

export const isDgiiConsumerFinalNcf = (value) => {
  const ncf = toCleanString(value) ?? '';
  return ncf.startsWith('B02') || ncf.startsWith('E32');
};

export const isDgiiCreditOrDebitNoteNcf = (value) => {
  const ncf = toCleanString(value) ?? '';
  return (
    ncf.startsWith('B03') ||
    ncf.startsWith('B04') ||
    ncf.startsWith('E33') ||
    ncf.startsWith('E34')
  );
};
