export interface ProductBrandFieldMeta {
  label: string;
  placeholder: string;
  helper: string;
}

export const getProductBrandFieldMeta = (
  typeValue?: string | null,
): ProductBrandFieldMeta => {
  const normalizedType = (typeValue || '').toLowerCase();

  if (
    normalizedType.includes('medic') ||
    normalizedType.includes('farm') ||
    normalizedType.includes('salud')
  ) {
    return {
      label: 'Marca / Laboratorio',
      placeholder: 'Ej: Pfizer, Genfar, Laboratorio ACME',
      helper:
        'Indica la marca comercial, laboratorio o denominación bajo la cual se vende el producto.',
    };
  }

  if (
    normalizedType.includes('bebida') ||
    normalizedType.includes('alimento') ||
    normalizedType.includes('consumo')
  ) {
    return {
      label: 'Marca / Casa comercial',
      placeholder: 'Ej: Coca-Cola, La Costeña, Artesanal',
      helper:
        'Puedes registrar la marca comercial, línea artesanal o fabricante principal.',
    };
  }

  if (
    normalizedType.includes('cosm') ||
    normalizedType.includes('higiene') ||
    normalizedType.includes('belleza')
  ) {
    return {
      label: 'Marca / Línea',
      placeholder: "Ej: L'Oréal, Dove, Genérico",
      helper:
        'Define la casa comercial, línea o fabricante responsable del producto.',
    };
  }

  return {
    label: 'Marca',
    placeholder: 'Ej: Samsung, Genérico, Marca Propia',
    helper:
      'Registra la marca, fabricante o referencia que identifique el producto en tu catálogo.',
  };
};
