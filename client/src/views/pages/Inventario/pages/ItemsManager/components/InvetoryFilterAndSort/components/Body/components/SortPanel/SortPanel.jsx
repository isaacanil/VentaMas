import React, { useEffect, useState } from 'react'
import { opcionesCriterio, opcionesOrden } from '../../../../InventoryFilterAndSortMetadata'
import { useDispatch, useSelector } from 'react-redux';
import { selectCriterio, selectOrden, setCriterio, setOrden } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import styled from 'styled-components';
import { SubTitle } from '../../../../../../../../../checkout/Receipt';
import * as antd from 'antd';
const { Radio, Space } = antd;
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
            <GroupContainer>
                <SubTitle>Ordenar por:</SubTitle>
                <Radio.Group
                    onChange={(e) => handleCriterioChange(e.target.value)}
                    value={criterio}
                    style={{
                        width: '100%',

                    }}
                    buttonStyle="solid"
                >
                    <Space
                        direction="vertical"
                        style={{
                            width: '100%',
                        }}
                    >

                        {opcionesCriterio.map((opcion, index) => (
                            <Radio.Button
                                style={{
                                    width: '100%',

                                }}

                                value={opcion.valor}
                                key={index}>
                                {opcion.etiqueta}
                            </Radio.Button>
                        ))}
                    </Space>
                </Radio.Group>
            </GroupContainer>
            <GroupContainer>
                <SubTitle>Orden:</SubTitle>
                <Radio.Group
                    buttonStyle='solid'
                    onChange={(e) => handleOrdenChange(e.target.value)}
                    value={orden}
                    style={{
                        width: '100%',
                    }}
                >

                 

                        {(opcionesOrden[criterio || 'asc']?.length > 0) && (opcionesOrden[criterio || 'asc']).map((opcion, index) => (
                            <Radio.Button
                                value={opcion.valor}
                                key={index}>
                                {opcion.etiqueta}
                            </Radio.Button>
                        ))}
                   

                </Radio.Group>
            </GroupContainer>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 1.8em;
    overflow: hidden;
    
`
const GroupContainer = styled.div`
    display: grid;
    gap: 0.5em;
    width: 100%;
    align-items: center;
`
