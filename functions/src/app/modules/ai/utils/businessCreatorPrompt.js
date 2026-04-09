const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

const formatLine = (label, value) => `${label}: ${value.trim()}`;

export const buildBusinessCreatorPrompt = (input) => {
  const coreLines = [
    formatLine('Idea del negocio', hasValue(input.idea) ? input.idea : 'Sin detalle'),
  ];

  if (hasValue(input.name)) {
    coreLines.push(formatLine('Nombre actual/deseado', input.name));
  }
  if (hasValue(input.businessType)) {
    coreLines.push(formatLine('Tipo de negocio actual (si ya fue elegido)', input.businessType));
  }
  if (hasValue(input.country)) {
    coreLines.push(formatLine('País', input.country));
  }
  if (hasValue(input.province)) {
    coreLines.push(formatLine('Provincia', input.province));
  }
  if (hasValue(input.address)) {
    coreLines.push(formatLine('Dirección (si ya existe)', input.address));
  }

  const userProvidedFields = [];
  if (hasValue(input.rnc)) {
    userProvidedFields.push(formatLine('RNC provisto por usuario', input.rnc));
  }
  if (hasValue(input.email)) {
    userProvidedFields.push(formatLine('Email provisto por usuario', input.email));
  }
  if (hasValue(input.tel)) {
    userProvidedFields.push(formatLine('Teléfono provisto por usuario', input.tel));
  }

  const lines = [
    'Ayuda a prellenar el formulario de creación de negocio de VentaMas.',
    'Responde en español, con tono operativo y directo.',
    'Solo sugiere nombre, tipo de negocio (general/pharmacy), país y provincia.',
    'No inventes RNC, email, teléfono ni dirección. Si no hay dato suficiente, deja esos campos fuera de tus inferencias.',
    '',
    ...coreLines,
    ...(userProvidedFields.length
      ? ['', 'Datos ya provistos por el usuario (no reinventar):', ...userProvidedFields]
      : []),
    '',
    'Además devuelve una guía breve: resumen, checklist de arranque y riesgos/validaciones.',
  ];

  return lines.join('\n');
};
