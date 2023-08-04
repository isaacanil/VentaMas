import React, { useEffect, useState } from 'react'
import { opcionesCriterio, opcionesOrden } from '../../../../InventoryFilterAndSortMetadata'
import { useDispatch, useSelector } from 'react-redux';
import { selectCriterio, selectOrden, setCriterio, setOrden } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import styled from 'styled-components';
import { SubTitle } from '../../../../../../../../../checkout/Receipt';

export const SortPanel = ({ Label, Group }) => {
    const [isCriterioChanged, setIsCriterioChanged] = useState(false);

    const dispatch = useDispatch();
    const criterio = useSelector(selectCriterio);

    // Función para manejar el cambio de criterio
    const orden = useSelector(selectOrden);

    const handleCriterioChange = (newCriterio) => {
        dispatch(setCriterio(newCriterio)); // Suponiendo que setCriterio es tu acción para cambiar el criterio
        setIsCriterioChanged(true);
    };

    const handleOrdenChange = (nuevoOrden) => { dispatch(setOrden(nuevoOrden)) };

    useEffect(() => {
        const ordenPorCriterio = {
            'nombre': 'asc',
            'categoria': 'asc',
            'stock': 'ascNum',
            'impuesto': 'ascNum',
            'costo': 'ascNum',
            'precio': 'ascNum',
            'inventariable': true
        };
        if (isCriterioChanged) {
            handleOrdenChange(ordenPorCriterio[criterio]);
            setIsCriterioChanged(false); // Restablece la bandera para futuros cambios
        }
    }, [criterio, isCriterioChanged]);

    return (
        <Container>
            <div>
                <SubTitle>Ordenar por:</SubTitle>
                <Group
                    column
                    themeColor={'neutral'}
                >
                    {
                        opcionesCriterio.length > 0 &&
                        opcionesCriterio.map((opcion, index) => (
                            <Label key={index}
                                selected={criterio === opcion.valor}
                                themeColor={'neutral'}
                            >
                                <input type="radio" value={opcion.valor} checked={criterio === opcion.valor} onChange={() => handleCriterioChange(opcion.valor)} />
                                {opcion.etiqueta}
                            </Label>
                        ))
                    }
                </Group>
            </div>
            <div>
                <SubTitle>Orden:</SubTitle>
                <Group
                    themeColor={'neutral'}
                    fillBtn
                >
                    {
                        (opcionesOrden[criterio || 'asc']?.length > 0) &&
                        (opcionesOrden[criterio || 'asc']).map((opcion, index) => (
                            <Label key={index}
                                selected={orden === opcion.valor}
                                themeColor={'neutral'}
                            >
                                <input type="radio" value={opcion.valor} checked={orden === opcion.valor} onChange={() => handleOrdenChange(opcion.valor)} />
                                {opcion.etiqueta}
                            </Label>
                        ))}
                </Group>
            </div>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 0.6em;
`
