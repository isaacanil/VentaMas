import { Segmented, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../../../../features/auth/userSlice';
import {
  DEFAULT_FILTER_CONTEXT,
  DEFAULT_FILTERS,
  selectInventariable,
  selectItbis,
  selectPriceStatus,
  selectCostStatus,
  selectPromotionStatus,
  setInventariable,
  setItbis,
  setPriceStatus,
  setCostStatus,
  setPromotionStatus,
  setStockAvailability,
  setStockAlertLevel,
  setStockRequirement,
  selectStockAvailability,
  selectStockAlertLevel,
  selectStockRequirement,
  setStockLocations,
  selectStockLocations,
} from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { getWarehousesStockAggregates } from '../../../../../../../../../../../firebase/warehouse/productStockService';
import { useListenWarehouses } from '../../../../../../../../../../../firebase/warehouse/warehouseService';
import {
  opcionesInventariable,
  opcionesItbis,
} from '../../../../InventoryFilterAndSortMetadata';
import { LabelWithStatus } from '../SortPanel/SortPanel';

import { InventoryLocationSelector } from './InventoryLocationSelector';

const normalizeArray = (value = []) =>
  Array.isArray(value) ? [...value].sort() : [];

const isDefaultFilterValue = (field, current) => {
  const defaultValue = DEFAULT_FILTERS[field];
  if (current === undefined) return true;
  if (current === null) {
    if (Array.isArray(defaultValue)) return defaultValue.length === 0;
    return defaultValue === null || defaultValue === undefined;
  }
  if (Array.isArray(defaultValue)) {
    const defaultArr = normalizeArray(defaultValue);
    const currentArr = normalizeArray(current);
    if (defaultArr.length !== currentArr.length) return false;
    return defaultArr.every((item, index) => item === currentArr[index]);
  }
  return current === defaultValue;
};

const INVENTORY_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos', availability: 'todos', alert: 'todos' },
  {
    value: 'conStock',
    label: 'Con stock',
    availability: 'conStock',
    alert: 'todos',
  },
  {
    value: 'sinStock',
    label: 'Sin stock',
    availability: 'sinStock',
    alert: 'todos',
  },
  {
    value: 'stockNormal',
    label: 'Stock normal',
    availability: 'conStock',
    alert: 'normal',
  },
  {
    value: 'stockBajo',
    label: 'Stock bajo',
    availability: 'conStock',
    alert: 'bajo',
  },
  {
    value: 'stockCritico',
    label: 'Stock crítico',
    availability: 'conStock',
    alert: 'critico',
  },
];
const PRICE_STATUS_SEGMENTS = [
  { value: 'todos', label: 'Todos' },
  { value: 'conPrecio', label: 'Con precio' },
  { value: 'sinPrecio', label: 'Sin precio' },
];
const COST_STATUS_SEGMENTS = [
  { value: 'todos', label: 'Todos' },
  { value: 'conCosto', label: 'Con costo' },
  { value: 'sinCosto', label: 'Sin costo' },
];
const PROMOTION_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'promocionActiva', label: 'Con promoción' },
  { value: 'sinPromocion', label: 'Sin promoción' },
];

export const FilterPanel = ({ contextKey = DEFAULT_FILTER_CONTEXT }) => {
  const inventariable = useSelector((state) =>
    selectInventariable(state, contextKey),
  );
  const itbis = useSelector((state) => selectItbis(state, contextKey));
  const priceStatus = useSelector((state) =>
    selectPriceStatus(state, contextKey),
  );
  const costStatus = useSelector((state) =>
    selectCostStatus(state, contextKey),
  );
  const promotionStatus = useSelector((state) =>
    selectPromotionStatus(state, contextKey),
  );
  const stockAvailability = useSelector((state) =>
    selectStockAvailability(state, contextKey),
  );
  const stockAlertLevel = useSelector((state) =>
    selectStockAlertLevel(state, contextKey),
  );
  const stockRequirement = useSelector((state) =>
    selectStockRequirement(state, contextKey),
  );
  const stockLocations = useSelector((state) =>
    selectStockLocations(state, contextKey),
  );
  const user = useSelector(selectUser);

  const dispatch = useDispatch();
  const { data: warehouses = [], loading: warehousesLoading } =
    useListenWarehouses();
  const [warehouseSummaries, setWarehouseSummaries] = useState({});
  const [warehouseSummariesLoading, setWarehouseSummariesLoading] =
    useState(false);
  const warehouseIds = useMemo(
    () => (warehouses || []).map((warehouse) => warehouse?.id).filter(Boolean),
    [warehouses],
  );
  useEffect(() => {
    let isMounted = true;
    const fetchSummaries = async () => {
      if (!user?.businessID || warehouseIds.length === 0) {
        if (isMounted) {
          setWarehouseSummaries({});
          setWarehouseSummariesLoading(false);
        }
        return;
      }
      try {
        setWarehouseSummariesLoading(true);
        const summaries = await getWarehousesStockAggregates(
          user,
          warehouseIds,
        );
        if (!isMounted) return;
        setWarehouseSummaries(summaries);
      } catch (error) {
        console.error('Error obteniendo agregados de almacenes:', error);
        if (isMounted) {
          setWarehouseSummaries({});
        }
      } finally {
        if (isMounted) setWarehouseSummariesLoading(false);
      }
    };

    fetchSummaries();
    return () => {
      isMounted = false;
    };
  }, [user?.businessID, warehouseIds]);

  const handleItbisChange = (newItbis) => {
    dispatch(setItbis({ context: contextKey, value: newItbis }));
  };
  const handlePriceStatusChange = (value) => {
    dispatch(setPriceStatus({ context: contextKey, value }));
  };
  const handleCostStatusChange = (value) => {
    dispatch(setCostStatus({ context: contextKey, value }));
  };
  const handlePromotionStatusChange = (value) => {
    dispatch(setPromotionStatus({ context: contextKey, value }));
  };
  const handleInventariableChange = (newInventariable) => {
    dispatch(
      setInventariable({ context: contextKey, value: newInventariable }),
    );
  };
  const handleInventoryStatusChange = (value) => {
    const option = INVENTORY_STATUS_OPTIONS.find((opt) => opt.value === value);
    if (!option) return;
    dispatch(
      setStockAvailability({ context: contextKey, value: option.availability }),
    );
    dispatch(setStockAlertLevel({ context: contextKey, value: option.alert }));
  };
  const handleStockRequirementChange = (v) => {
    dispatch(setStockRequirement({ context: contextKey, value: v }));
  };
  const handleStockLocationsChange = (values) => {
    dispatch(setStockLocations({ context: contextKey, value: values }));
  };
  const inventariableOptions = opcionesInventariable.map((o) => ({
    value: o.valor,
    label: o.etiqueta,
  }));
  const itbisSegments = opcionesItbis.map((o) => ({
    value: o.valor,
    label: o.etiqueta,
  }));
  const locationOptions = useMemo(
    () =>
      (warehouses || [])
        .map((warehouse) => {
          if (!warehouse?.id) return null;
          const summary = warehouseSummaries?.[warehouse.id];
          const hasSummary = summary !== undefined;
          const totalLots = Number(summary?.totalLots ?? 0);
          const totalUnits = Number(summary?.totalUnits ?? 0);
          const subtitle = hasSummary
            ? `${totalLots} lotes · ${totalUnits} uds`
            : warehouseSummariesLoading
              ? 'calculando...'
              : 'sin datos';
          const title = warehouse.name || warehouse.shortName || warehouse.id;
          return {
            id: warehouse.id,
            title,
            subtitle,
            searchText: `${title} ${subtitle}`.trim(),
          };
        })
        .filter(Boolean),
    [warehouses, warehouseSummaries, warehouseSummariesLoading],
  );

  const showInventoryFilters = inventariable !== 'no';
  const inventoryStatusValue = useMemo(() => {
    const match = INVENTORY_STATUS_OPTIONS.find(
      (opt) =>
        opt.availability === stockAvailability && opt.alert === stockAlertLevel,
    );
    return match ? match.value : 'custom';
  }, [stockAvailability, stockAlertLevel]);

  const inventoryStatusOptions = useMemo(() => {
    if (inventoryStatusValue !== 'custom') return INVENTORY_STATUS_OPTIONS;
    return [
      ...INVENTORY_STATUS_OPTIONS,
      {
        value: 'custom',
        label: 'Combinación personalizada',
        disabled: true,
      },
    ];
  }, [inventoryStatusValue]);

  useEffect(() => {
    if (showInventoryFilters) return;
    if (stockAvailability !== 'todos') {
      dispatch(setStockAvailability({ context: contextKey, value: 'todos' }));
    }
    if (stockAlertLevel !== 'todos') {
      dispatch(setStockAlertLevel({ context: contextKey, value: 'todos' }));
    }
    if (stockRequirement !== 'todos') {
      dispatch(setStockRequirement({ context: contextKey, value: 'todos' }));
    }
    if (stockLocations?.length) {
      dispatch(setStockLocations({ context: contextKey, value: [] }));
    }
  }, [
    showInventoryFilters,
    stockAvailability,
    stockAlertLevel,
    stockRequirement,
    stockLocations?.length,
    dispatch,
    contextKey,
  ]);

  const modificationStatus = useMemo(
    () => ({
      inventariable: !isDefaultFilterValue('inventariable', inventariable),
      stockLocations: !isDefaultFilterValue('stockLocations', stockLocations),
      inventoryStatus:
        !isDefaultFilterValue('stockAvailability', stockAvailability) ||
        !isDefaultFilterValue('stockAlertLevel', stockAlertLevel),
      stockRequirement: !isDefaultFilterValue(
        'stockRequirement',
        stockRequirement,
      ),
      itbis: !isDefaultFilterValue('itbis', itbis),
      priceStatus: !isDefaultFilterValue('priceStatus', priceStatus),
      costStatus: !isDefaultFilterValue('costStatus', costStatus),
      promotionStatus: !isDefaultFilterValue(
        'promotionStatus',
        promotionStatus,
      ),
    }),
    [
      inventariable,
      stockLocations,
      stockAvailability,
      stockAlertLevel,
      stockRequirement,
      itbis,
      priceStatus,
      costStatus,
      promotionStatus,
    ],
  );

  return (
    <Container>
      <Section>
        <SectionTitle>Inventario</SectionTitle>
        <GroupContainer>
          <LabelWithStatus modified={modificationStatus.inventariable}>
            Inventariable:
          </LabelWithStatus>
          <Segmented
            block
            size="middle"
            value={inventariable}
            options={inventariableOptions}
            onChange={handleInventariableChange}
          />
        </GroupContainer>
        {showInventoryFilters && (
          <>
            <GroupContainer>
              <LabelWithStatus modified={modificationStatus.stockLocations}>
                Ubicaciones de inventario:
              </LabelWithStatus>
              <InventoryLocationSelector
                value={stockLocations}
                onChange={handleStockLocationsChange}
                options={locationOptions}
                loading={warehousesLoading || warehouseSummariesLoading}
                placeholder="Todos los almacenes"
              />
            </GroupContainer>
            <FieldGrid>
              <GroupContainer>
                <LabelWithStatus modified={modificationStatus.inventoryStatus}>
                  Estado de inventario:
                </LabelWithStatus>
                <Select
                  style={{ width: '100%' }}
                  value={inventoryStatusValue}
                  onChange={handleInventoryStatusChange}
                  options={inventoryStatusOptions}
                />
              </GroupContainer>
              <GroupContainer>
                <LabelWithStatus modified={modificationStatus.stockRequirement}>
                  Productos con stock requerido:
                </LabelWithStatus>
                <Segmented
                  block
                  size="middle"
                  value={stockRequirement}
                  onChange={handleStockRequirementChange}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'requiere', label: 'Sí' },
                    { value: 'noRequiere', label: 'No' },
                  ]}
                />
              </GroupContainer>
            </FieldGrid>
          </>
        )}
      </Section>
      <Section>
        <SectionTitle>Precios y fiscal</SectionTitle>
        <FieldGrid>
          <GroupContainer>
            <LabelWithStatus modified={modificationStatus.itbis}>
              ITBIS:
            </LabelWithStatus>
            <Segmented
              block
              size="middle"
              value={itbis}
              onChange={handleItbisChange}
              options={itbisSegments}
            />
          </GroupContainer>
          <GroupContainer>
            <LabelWithStatus modified={modificationStatus.priceStatus}>
              Estado de precio:
            </LabelWithStatus>
            <Segmented
              block
              size="middle"
              value={priceStatus}
              onChange={handlePriceStatusChange}
              options={PRICE_STATUS_SEGMENTS}
            />
          </GroupContainer>
          <GroupContainer>
            <LabelWithStatus modified={modificationStatus.costStatus}>
              Estado de costo:
            </LabelWithStatus>
            <Segmented
              block
              size="middle"
              value={costStatus}
              onChange={handleCostStatusChange}
              options={COST_STATUS_SEGMENTS}
            />
          </GroupContainer>
          <GroupContainer>
            <LabelWithStatus modified={modificationStatus.promotionStatus}>
              Promociones:
            </LabelWithStatus>
            <Segmented
              block
              size="middle"
              value={promotionStatus}
              onChange={handlePromotionStatusChange}
              options={PROMOTION_STATUS_OPTIONS}
            />
          </GroupContainer>
        </FieldGrid>
      </Section>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  gap: 1.1em;
`;
const Section = styled.div`
  display: grid;
  gap: 0.85em;
`;
const SectionTitle = styled.p`
  display: flex;
  gap: 0.6em;
  align-items: center;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0b528bff;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &::after {
    flex: 1;
    height: 1px;
    content: '';
    background-color: #0b528bff;
  }
`;
const FieldGrid = styled.div`
  display: grid;
  gap: 1.1em;
  align-items: start;
`;
const GroupContainer = styled.div`
  display: grid;
  gap: 0.35em;
  align-items: start;
  width: 100%;

  label,
  span,
  p {
    font-size: 0.78rem;
  }
`;
