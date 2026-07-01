type PriceRuleRow = {
  cost?: number;
  required?: boolean;
};

export const getPriceRules = (record: PriceRuleRow) => {
  if (!record.required) {
    return [{ type: 'number' as const, min: 0, message: 'No puede ser negativo.' }];
  }

  return [
    { required: true, message: 'Rellenar' },
    {
      type: 'number' as const,
      min: record?.cost || 0,
      message: `Minimo ${record?.cost}`,
    },
  ];
};
