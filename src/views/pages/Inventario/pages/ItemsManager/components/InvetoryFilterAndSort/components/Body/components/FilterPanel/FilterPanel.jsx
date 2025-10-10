import { Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectInventariable, selectItbis, setInventariable, setItbis, setStockAvailability, setStockAlertLevel, setStockRequirement, selectStockAvailability, selectStockAlertLevel, selectStockRequirement } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { opcionesInventariable, opcionesItbis } from '../../../../InventoryFilterAndSortMetadata'
import { Label } from '../SortPanel/SortPanel';

export const FilterPanel = ({ Group }) => {
    const inventariable = useSelector(selectInventariable);
    const itbis = useSelector(selectItbis);
    const stockAvailability = useSelector(selectStockAvailability);
    const stockAlertLevel = useSelector(selectStockAlertLevel);
    const stockRequirement = useSelector(selectStockRequirement);

    const dispatch = useDispatch();

    const handleItbisChange = (newItbis) => { dispatch(setItbis(newItbis)) };
    const handleInventariableChange = (newInventariable) => { dispatch(setInventariable(newInventariable)) };
    const handleStockAvailabilityChange = (v) => { dispatch(setStockAvailability(v)); };
    const handleStockAlertLevelChange = (v) => { dispatch(setStockAlertLevel(v)); };
    const handleStockRequirementChange = (v) => { dispatch(setStockRequirement(v)); };
    const inventariableOptions = opcionesInventariable.map(o => ({ value: o.valor, label: o.etiqueta }));
    const itbisOptions = opcionesItbis.map(o => ({ value: o.valor, label: o.etiqueta }));

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
