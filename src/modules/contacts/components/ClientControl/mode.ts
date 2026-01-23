type ClientModeValue = 'updateClient' | 'createClient' | 'searchClient' | string;

export const Mode = (value: ClientModeValue, setLabel: (label: string) => void): void => {
  if (value === 'updateClient') {
    setLabel('Actualizar Cliente');
  }
  if (value === 'createClient') {
    setLabel('Crear Cliente');
  }
  if (value === 'searchClient') {
    setLabel('Buscar Cliente');
  }
};
