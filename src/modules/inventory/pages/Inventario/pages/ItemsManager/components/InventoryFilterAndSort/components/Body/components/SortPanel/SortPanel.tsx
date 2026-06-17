import { Button, Select, Tooltip } from 'antd';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import {
  DEFAULT_FILTER_CONTEXT,
  DEFAULT_FILTERS,
  selectCriterio,
  selectOrden,
  setCriterio,
  setOrden,
  type FilterRootState,
} from '@/features/filterProduct/filterProductsSlice';
import { opcionesCriterio } from '@/modules/inventory/pages/Inventario/pages/ItemsManager/components/InventoryFilterAndSort/InventoryFilterAndSortMetadata';

import { LabelWithStatus } from '../shared/LabelWithStatus';

type SortPanelProps = {
  contextKey?: string;
};

type OrdenValue = string | boolean;

const ordenPorCriterio: Record<string, OrdenValue> = {
  nombre: 'asc',
  categoria: 'asc',
  stock: 'ascNum',
  impuesto: 'ascNum',
  costo: 'ascNum',
  precio: 'ascNum',
  inventariable: true,
};

const getDefaultOrdenForCriterio = (criterio: string): OrdenValue =>
  ordenPorCriterio[criterio] ?? DEFAULT_FILTERS.orden;

export const SortPanel = ({
  contextKey = DEFAULT_FILTER_CONTEXT,
}: SortPanelProps) => {
  const dispatch = useDispatch();
  const criterio = useSelector((state: FilterRootState) =>
    selectCriterio(state, contextKey),
  ) as string;

  // Función para manejar el cambio de criterio
  const orden = useSelector((state: FilterRootState) =>
    selectOrden(state, contextKey),
  ) as unknown as OrdenValue;

  const handleCriterioChange = useCallback(
    (newCriterio: string) => {
      dispatch(setCriterio({ context: contextKey, value: newCriterio }));
      dispatch(
        setOrden({
          context: contextKey,
          value: getDefaultOrdenForCriterio(newCriterio) as string,
        }),
      );
    },
    [contextKey, dispatch],
  );

  const handleOrdenChange = useCallback(
    (nuevoOrden: OrdenValue) => {
      dispatch(setOrden({ context: contextKey, value: nuevoOrden as string }));
    },
    [contextKey, dispatch],
  );

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
  grid-template-columns: 1fr min-content;
  gap: 0.65em;
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
