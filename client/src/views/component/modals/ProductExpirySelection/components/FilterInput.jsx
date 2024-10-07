// FilterInput.js
import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';

const StyledInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StyledInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  max-width: 300px;
`;

const FilterInput = ({ filtro, setFiltro, toggleOrden, ordenPor, ordenAscendente }) => {
  return (
    <StyledInputContainer>
      <StyledInput
        type="text"
        placeholder="Buscar en el inventario..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <div>
      <Button onClick={() => toggleOrden('almacen')} type="default">
  Almacén {ordenPor === 'almacen' && (ordenAscendente ? '↑' : '↓')}
</Button>
<Button onClick={() => toggleOrden('fechaExpiracion')} type="default">
  Fecha Exp. {ordenPor === 'fechaExpiracion' && (ordenAscendente ? '↑' : '↓')}
</Button>
<Button onClick={() => toggleOrden('stock')} type="default">
  Stock {ordenPor === 'stock' && (ordenAscendente ? '↑' : '↓')}
</Button>
      </div>
    </StyledInputContainer>
  );
};

export default FilterInput;