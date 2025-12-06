import { useState } from 'react';

const _updateNCF = (comprobante) => {
  const [_RNC, _setRNC] = useState('');
  const {
    name: _name,
    type: _type,
    serie: _serie,
    sequence: _sequence,
    increase: _increase,
    quantity: _quantity,
  } = comprobante;
};
