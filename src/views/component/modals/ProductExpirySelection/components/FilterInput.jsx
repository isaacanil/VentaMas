// FilterInput.js
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const StyledInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StyledInput = styled.input`
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
`;

const FilterInput = ({
  filtro,
  setFiltro,
  toggleOrden,
  ordenPor,
  ordenAscendente,
}) => {
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
          Fecha Exp.{' '}
          {ordenPor === 'fechaExpiracion' && (ordenAscendente ? '↑' : '↓')}
        </Button>
        <Button onClick={() => toggleOrden('stock')} type="default">
          Stock {ordenPor === 'stock' && (ordenAscendente ? '↑' : '↓')}
        </Button>
      </div>
    </StyledInputContainer>
  );
};

export default FilterInput;
