import React from 'react'
import { opcionesInventariable, opcionesItbis, opcionesVisible } from '../../../../InventoryFilterAndSortMetadata'
import { useDispatch, useSelector } from 'react-redux';
import { selectInventariable, selectItbis, setInventariable, setItbis } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { SubTitle } from '../../../../../../../../../checkout/Receipt';
import styled from 'styled-components';

export const FilterPanel = ({ Group, Label }) => {
    const inventariable = useSelector(selectInventariable);
    const itbis = useSelector(selectItbis);

    const dispatch = useDispatch();

    const handleItbisChange = (newItbis) => { dispatch(setItbis(newItbis)) };

    const handleInventariableChange = (newInventariable) => { dispatch(setInventariable(newInventariable)) };
    return (
        <Container>
            <div>
                <SubTitle>Inventariable:</SubTitle>
                <Group
                    column
                    themeColor={'neutral'}
                >
                    {opcionesInventariable.map((opcion, index) => (
                        <Label
                            key={index}
                            themeColor={'neutral'}
                            selected={inventariable === opcion.valor}
                        >
                            <input type="radio" value={opcion.valor} checked={inventariable === opcion.valor} onChange={() => handleInventariableChange(opcion.valor)} />
                            {opcion.etiqueta}
                        </Label>
                    ))}
                </Group>
            </div>
            <div>
                <SubTitle>ITBIS:</SubTitle>
                <Group column>
                    {opcionesItbis.map((opcion, index) => (
                        <Label
                            key={index}
                            themeColor={'neutral'}
                            selected={itbis === opcion.valor}
                        >
                            <input type="radio" value={opcion.valor} checked={itbis === opcion.valor} onChange={() => handleItbisChange(opcion.valor)} />
                            {opcion.etiqueta}
                        </Label>
                    ))}
                </Group>
            </div>
            {/* <div>
                <SubTitle>Visible:</SubTitle>
                <Group column>
                    {opcionesVisible.map((opcion, index) => (
                        <Label
                            key={index}
                            themeColor={'neutral'}
                            selected={itbis === opcion.valor}
                        >
                            <input type="radio" value={opcion.valor} checked={itbis === opcion.valor} onChange={() => handleItbisChange(opcion.valor)} />
                            {opcion.etiqueta}
                        </Label>
                    ))}
                </Group>
            </div> */}
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 0.6em;
   

`