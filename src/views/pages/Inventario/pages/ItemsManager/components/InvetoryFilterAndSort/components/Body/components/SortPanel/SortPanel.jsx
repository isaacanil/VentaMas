import { Button, Select, Tooltip } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../../../../../../../constants/icons/icons';
import {
  DEFAULT_FILTER_CONTEXT,
  DEFAULT_FILTERS,
  selectCriterio,
  selectOrden,
  setCriterio,
  setOrden,
} from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { opcionesCriterio } from '../../../../InventoryFilterAndSortMetadata';

export const SortPanel = ({ contextKey = DEFAULT_FILTER_CONTEXT }) => {
  const [isCriterioChanged, setIsCriterioChanged] = useState(false);

  const dispatch = useDispatch();
  const criterio = useSelector((state) => selectCriterio(state, contextKey));

  // Función para manejar el cambio de criterio
  const orden = useSelector((state) => selectOrden(state, contextKey));

  const handleCriterioChange = (newCriterio) => {
    dispatch(setCriterio({ context: contextKey, value: newCriterio }));
    setIsCriterioChanged(true);
  };

  const handleOrdenChange = (nuevoOrden) => {
    dispatch(setOrden({ context: contextKey, value: nuevoOrden }));
  };

  useEffect(() => {
    const ordenPorCriterio = {
      nombre: 'asc',
      categoria: 'asc',
      stock: 'ascNum',
      impuesto: 'ascNum',
      costo: 'ascNum',
      precio: 'ascNum',
      inventariable: true,
    };
    if (isCriterioChanged) {
      handleOrdenChange(ordenPorCriterio[criterio]);
      setIsCriterioChanged(false); // Restablece la bandera para futuros cambios
    }
  }, [criterio, isCriterioChanged]);

  const criterioOptions = opcionesCriterio.map((o) => ({
    value: o.valor,
    label: o.etiqueta,
  }));

  // Determinar el tipo de criterio actual (alfabético, numérico, booleano) para saber qué pares alternar
  const tipoCriterio = useMemo(() => {
    if (['nombre', 'categoria'].includes(criterio)) return 'alf';
    if (['stock', 'costo', 'precio', 'impuesto'].includes(criterio))
      return 'num';
    if (criterio === 'inventariable') return 'bool';
    return 'alf'; // fallback
  }, [criterio]);

  const toggleOrdenValue = () => {
    if (tipoCriterio === 'alf') {
      return orden === 'asc' ? 'desc' : 'asc';
    }
    if (tipoCriterio === 'num') {
      return orden === 'ascNum' ? 'descNum' : 'ascNum';
    }
    if (tipoCriterio === 'bool') {
      return orden === true || orden === 'true' ? false : true; // cubrir string guardado
    }
    return 'asc';
  };

  const handleToggleOrden = () => {
    const nuevo = toggleOrdenValue();
    handleOrdenChange(nuevo);
  };

  const currentOrdenLabel = useMemo(() => {
    if (tipoCriterio === 'alf')
      return orden === 'asc' ? 'Ascendente' : 'Descendente';
    if (tipoCriterio === 'num')
      return orden === 'ascNum' ? 'Ascendente' : 'Descendente';
    if (tipoCriterio === 'bool')
      return orden === true || orden === 'true' ? 'Sí primero' : 'No primero';
    return '';
  }, [orden, tipoCriterio]);

  const ordenIcon = useMemo(() => {
    if (tipoCriterio === 'alf')
      return orden === 'asc'
        ? icons.operationModes.sortAsc
        : icons.operationModes.sortDesc;
    if (tipoCriterio === 'num')
      return orden === 'ascNum'
        ? icons.operationModes.sortAscNum
        : icons.operationModes.sortDescNum;
    if (tipoCriterio === 'bool')
      return orden === true || orden === 'true'
        ? icons.arrows.caretUp
        : icons.arrows.caretDown;
    return icons.operationModes.sortAsc;
  }, [orden, tipoCriterio]);

  const isCriterioModified = criterio !== DEFAULT_FILTERS.criterio;
  const isOrdenModified = orden !== DEFAULT_FILTERS.orden;

  return (
    <Container>
      <Row>
        <FlexGrow>
          <LabelWithStatus modified={isCriterioModified}>
            Ordenar por:
          </LabelWithStatus>
          <Select
            style={{ maxWidth: '300px' }}
            value={criterio}
            onChange={handleCriterioChange}
            options={criterioOptions}
          />
        </FlexGrow>
        <FlexGrow>
          <LabelWithStatus modified={isOrdenModified}>Orden</LabelWithStatus>
          <Tooltip
            title={`Cambiar orden: ${currentOrdenLabel}`}
            placement="top"
          >
            <Button
              aria-label={`Orden actual ${currentOrdenLabel}. Click para alternar.`}
              onClick={handleToggleOrden}
              icon={ordenIcon}
            />
          </Tooltip>
        </FlexGrow>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9em;
`;
const Row = styled.div`
  display: grid;
  gap: 0.65em;
  grid-template-columns: 1fr min-content;
  align-items: flex-end;
`;

const FlexGrow = styled.div`
  display: grid;
  gap: 0.35em;
  label,
  span,
  p {
    font-size: 0.78rem;
  }
  /* Evitar tooltip nativo (title) en item seleccionado */
  .ant-select-selection-item {
    pointer-events: none;
  }
`;

export const Label = styled.label`
  font-size: 0.72rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
`;

const ModifiedMarker = styled.div`
  background-color: #ffaa0bff;
  border-radius: 50%;

  width: 0.7rem;
  height: 0.7rem;
  font-size: 0.7rem;
  border: 1px solid #ffffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
`;

export const LabelWithStatus = ({ children, modified }) => (
  <Label>
    <span>{children}</span>
    {modified ? <ModifiedMarker aria-hidden="true"></ModifiedMarker> : null}
  </Label>
);
