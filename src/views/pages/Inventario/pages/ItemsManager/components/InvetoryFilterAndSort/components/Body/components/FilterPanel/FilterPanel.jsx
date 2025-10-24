import { Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { DEFAULT_FILTER_CONTEXT, selectInventariable, selectItbis, setInventariable, setItbis, setStockAvailability, setStockAlertLevel, setStockRequirement, selectStockAvailability, selectStockAlertLevel, selectStockRequirement, setStockLocations, selectStockLocations } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { selectUser } from '../../../../../../../../../../../features/auth/userSlice';
import { useListenWarehouses } from '../../../../../../../../../../../firebase/warehouse/warehouseService';
import { getWarehousesStockAggregates } from '../../../../../../../../../../../firebase/warehouse/productStockService';
import { opcionesInventariable, opcionesItbis } from '../../../../InventoryFilterAndSortMetadata';
import { InventoryLocationSelector } from './InventoryLocationSelector';
import { Label } from '../SortPanel/SortPanel';

export const FilterPanel = ({ Group, contextKey = DEFAULT_FILTER_CONTEXT }) => {
    const inventariable = useSelector((state) => selectInventariable(state, contextKey));
    const itbis = useSelector((state) => selectItbis(state, contextKey));
    const stockAvailability = useSelector((state) => selectStockAvailability(state, contextKey));
    const stockAlertLevel = useSelector((state) => selectStockAlertLevel(state, contextKey));
    const stockRequirement = useSelector((state) => selectStockRequirement(state, contextKey));
    const stockLocations = useSelector((state) => selectStockLocations(state, contextKey));
    const user = useSelector(selectUser);

    const dispatch = useDispatch();
    const { data: warehouses = [], loading: warehousesLoading } = useListenWarehouses();
    const [warehouseSummaries, setWarehouseSummaries] = useState({});
    const [warehouseSummariesLoading, setWarehouseSummariesLoading] = useState(false);
    const warehouseIds = useMemo(
        () => (warehouses || []).map((warehouse) => warehouse?.id).filter(Boolean),
        [warehouses]
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
                const summaries = await getWarehousesStockAggregates(user, warehouseIds);
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
    const handleInventariableChange = (newInventariable) => {
        dispatch(setInventariable({ context: contextKey, value: newInventariable }));
    };
    const handleStockAvailabilityChange = (v) => {
        dispatch(setStockAvailability({ context: contextKey, value: v }));
    };
    const handleStockAlertLevelChange = (v) => {
        dispatch(setStockAlertLevel({ context: contextKey, value: v }));
    };
    const handleStockRequirementChange = (v) => {
        dispatch(setStockRequirement({ context: contextKey, value: v }));
    };
    const handleStockLocationsChange = (values) => {
        dispatch(setStockLocations({ context: contextKey, value: values }));
    };
    const inventariableOptions = opcionesInventariable.map(o => ({ value: o.valor, label: o.etiqueta }));
    const itbisOptions = opcionesItbis.map(o => ({ value: o.valor, label: o.etiqueta }));
    const locationOptions = useMemo(
        () =>
            (warehouses || [])
                .map((warehouse) => {
                    if (!warehouse?.id) return null;
                    const summary = warehouseSummaries?.[warehouse.id];
                    const hasSummary = summary !== undefined;
                    const totalItems = Number(summary?.totalItems ?? 0);
                    const totalQuantity = Number(summary?.totalQuantity ?? 0);
                    const subtitle = hasSummary
                        ? `${totalItems} lotes · ${totalQuantity} uds`
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
        [warehouses, warehouseSummaries, warehouseSummariesLoading]
    );

    return (
        <Container>
            <GroupContainer>
                <Label>Inventariable:</Label>
                <Select
                    style={{ width: '100%' }}
                    value={inventariable}
                    size='large'
                    onChange={handleInventariableChange}
                    options={inventariableOptions}
                />
            </GroupContainer>
            <GroupContainer>
                <Label>ITBIS:</Label>
                <Select
                    style={{ width: '100%' }}
                    value={itbis}
                    size='large'
                    onChange={handleItbisChange}
                    options={itbisOptions}
                />
            </GroupContainer>
            <GroupContainer>
                <Label>Disponibilidad:</Label>
                <Select
                    style={{ width: '100%' }}
                    value={stockAvailability}
                    onChange={handleStockAvailabilityChange}
                    size='large'
                    options={[
                        { value: 'todos', label: 'Todos' },
                        { value: 'conStock', label: 'Con stock' },
                        { value: 'sinStock', label: 'Sin stock' },
                    ]}
                />
            </GroupContainer>
            <GroupContainer>
                <Label>Nivel de alerta:</Label>
                <Select
                    style={{ width: '100%' }}
                    value={stockAlertLevel}
                    onChange={handleStockAlertLevelChange}
                    size='large'
                    options={[
                        { value: 'todos', label: 'Todos' },
                        { value: 'bajo', label: 'Stock bajo' },
                        { value: 'critico', label: 'Stock crítico' },
                        { value: 'normal', label: 'Normal' },
                    ]}
                />
            </GroupContainer>
            <GroupContainer>
                <Label>Requisito de stock (restringir venta sin stock):</Label>
                <Select
                    style={{ width: '100%' }}
                    value={stockRequirement}
                    onChange={handleStockRequirementChange}
                    size='large'
                    options={[
                        { value: 'todos', label: 'Todos' },
                        { value: 'requiere', label: 'Restringe sin stock' },
                        { value: 'noRequiere', label: 'No restringe' },
                    ]}
                />
            </GroupContainer>
            <GroupContainer>
                <Label>Ubicaciones de inventario:</Label>
                <InventoryLocationSelector
                    value={stockLocations}
                    onChange={handleStockLocationsChange}
                    options={locationOptions}
                    loading={warehousesLoading || warehouseSummariesLoading}
                    placeholder='Todos los almacenes'
                />
            </GroupContainer>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 1.1em;
`;
const GroupContainer = styled.div`
    display: grid;
    gap: 0.35em;
    width: 100%;
    align-items: start;
    label, span, p{font-size:.78rem;}
`;
