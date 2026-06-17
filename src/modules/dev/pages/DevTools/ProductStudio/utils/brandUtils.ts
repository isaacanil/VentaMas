interface BrandFieldMeta {
  label: string;
  placeholder: string;
  helper: string;
}

export const brandFieldMetaByType = (
  typeValue?: string | null,
): BrandFieldMeta => {
  const normalizedType = (typeValue || '').toLowerCase();
  if (
    normalizedType.includes('medic') ||
    normalizedType.includes('farm') ||
    normalizedType.includes('salud')
  ) {
    return {
      label: 'Marca / Laboratorio',
      placeholder: 'Pfizer, Genfar, Laboratorio ACME…',
      helper:
        'Indica la marca comercial o laboratorio responsable del producto.',
    };
  }
  if (
    normalizedType.includes('bebida') ||
    normalizedType.includes('alimento') ||
    normalizedType.includes('consumo')
  ) {
    return {
      label: 'Marca / Casa comercial',
      placeholder: 'Coca-Cola, La Costeña, Artesanal…',
      helper: 'Registra la casa comercial o fabricante.',
    };
  }
  if (
    normalizedType.includes('cosm') ||
    normalizedType.includes('higiene') ||
    normalizedType.includes('belleza')
  ) {
    return {
      label: 'Marca / Línea',
      placeholder: "L'Oréal, Dove, Genérico…",
      helper: 'Define la línea comercial o fabricante.',
    };
  }
  return {
    label: 'Marca',
    placeholder: 'Samsung, Genérico, Marca propia…',
    helper: 'Registra la marca o referencia principal.',
  };
};
