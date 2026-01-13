import React from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { SubTitle } from '@/modules/checkout/pages/checkout/Receipt';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';

type FilterSummaryProps = {
  criterio?: string;
  orden?: string | boolean;
};

export const FilterSumary = ({ criterio, orden }: FilterSummaryProps) => {
  // Mapeo de los valores de 'criterio' a sus descripciones correspondientes
  const criterioDescripcionMap: Record<string, string> = {
    nombre: 'Nombre del Producto',
    categoria: 'Categoría',
    stock: 'Stock',
    inventariable: 'Inventariable',
    costo: 'Costo',
    precio: 'Precio',
    impuesto: 'Impuesto',
    // Agrega más según sea necesario
  };

  // Mapeo de los valores de 'orden' a sus descripciones correspondientes
  const ordenDescripcionMap: Record<string, React.ReactNode> = {
    asc: icons.operationModes.sortAsc,
    desc: icons.operationModes.sortDesc,
    ascNum: icons.operationModes.sortAscNum,
    descNum: icons.operationModes.sortDescNum,
    true: 'Sí',
    false: 'No',
    // Agrega más según sea necesario
  };

  const renderSummary = (criterioValue?: string, ordenValue?: string | boolean) => {
    const criterioText =
      criterioDescripcionMap[criterioValue ?? ''] || 'Criterio desconocido';
    const ordenIcon = ordenDescripcionMap[String(ordenValue)] || 'Orden desconocido';

    return (
      <Wrapper>
        <Resumen>
          <FormattedValue
            noWrap
            value={`${criterioText}`}
            size={'medium'}
            type={'subtitle'}
          />
        </Resumen>
        <Icon>{ordenIcon}</Icon>
      </Wrapper>
    );
  };
  return (
    <Container>
      <SubTitle>Resumen: </SubTitle>
      <div>{renderSummary(criterio, orden)}</div>
    </Container>
  );
};
const Container = styled.div`
  height: 3em;

  div {
    padding: 0.2em;
    background-color: var(--white-3);
  }
`;
const Icon = styled.div`
  svg {
    height: 1.5em;
    color: gray;
  }
`;
const Resumen = styled.div`
  display: grid;
  gap: 0.2em;
  width: min-content;
  min-width: 180px;
`;
const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 2em;
  gap: 1em;
  width: fit-content;
`;
