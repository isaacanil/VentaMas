const formatTextValue = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (typeof trimmed === 'string' && trimmed.length === 0) {
    return null;
  }
  return trimmed;
};

const pickClientField = (d, ...keys) => {
  for (const key of keys) {
    const nested = formatTextValue(d?.client?.[key]);
    if (nested !== null && nested !== undefined) {
      return nested;
    }
    const flat = formatTextValue(d?.[key]);
    if (flat !== null && flat !== undefined) {
      return flat;
    }
  }
  return null;
};

export function buildClientBlock(d) {
  const rawName = pickClientField(d, 'name');
  const normalizedName =
    typeof rawName === 'string' ? rawName.toLowerCase() : '';
  const hasRealName = normalizedName && normalizedName !== 'generic client';
  const name = hasRealName ? rawName : 'Cliente Genérico';

  const address = pickClientField(d, 'address');
  const tel = pickClientField(d, 'tel');
  const tel2 = pickClientField(d, 'tel2');
  const personalId = pickClientField(d, 'personalID');

  const hasAnyDetail = Boolean(
    formatTextValue(rawName) || address || tel || tel2 || personalId,
  );
  if (!hasAnyDetail) {
    return null;
  }

  const detailLeft = [
    { label: 'Cliente', value: name },
    { label: 'Dirección', value: address },
  ]
    .filter((detail) => detail.value)
    .map((detail) => ({
      text: [
        { text: `${detail.label}:  `, bold: true },
        { text: String(detail.value), color: '#111' },
      ],
      style: 'headerInfo',
    }));

  const detailRight = [
    { label: 'Tel', value: tel },
    { label: 'Tel 2', value: tel2 },
    { label: 'RNC/Cédula', value: personalId },
  ]
    .filter((detail) => detail.value)
    .map((detail) => ({
      text: `${detail.label}: ${detail.value}`,
      style: 'headerInfo',
      noWrap: detail.label.startsWith('Tel'),
    }));

  const left = detailLeft;
  const right = detailRight;

  if (!left.length && !right.length) return null;

  return {
    columns: [
      { width: '*', stack: left },
      { width: '*', stack: right },
    ],
  };
}
