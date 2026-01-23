type UpdateObjectEvent = {
  target: {
    name: string;
    type?: string;
    value?: string | number;
    checked?: boolean;
  };
};

export const updateObject = <T extends Record<string, unknown>>(
  object: T,
  e: UpdateObjectEvent,
): T => {
  const { name, type } = e.target;
  let value;

  switch (type) {
    case 'checkbox':
      value = e.target.checked;
      break;
    case 'number':
      value = Number(e.target.value) || 0; // Retorna el valor como un número
      break;
    // Añade más casos según sea necesario...
    default:
      value = e.target.value;
  }

  // Hacemos una copia profunda del objeto usando JSON.stringify y JSON.parse
  const objectCopy = JSON.parse(JSON.stringify(object)) as Record<string, unknown>;

  const keys = name.split('.');
  let currentObj = objectCopy;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      currentObj[key] = value;
    } else {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key] as Record<string, unknown>;
    }
  }

  return objectCopy as T;
};
