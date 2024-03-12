import React from 'react'
import { opcionesInventariable, opcionesItbis, opcionesVisible } from '../../../../InventoryFilterAndSortMetadata'
import { useDispatch, useSelector } from 'react-redux';
import { selectInventariable, selectItbis, setInventariable, setItbis } from '../../../../../../../../../../../features/filterProduct/filterProductsSlice';
import { SubTitle } from '../../../../../../../../../checkout/Receipt';
import styled from 'styled-components';
import * as antd from 'antd';
const { Radio, Space } = antd;
export const FilterPanel = ({ Group, Label }) => {
    const inventariable = useSelector(selectInventariable);
    const itbis = useSelector(selectItbis);

    const dispatch = useDispatch();

    const handleItbisChange = (newItbis) => { dispatch(setItbis(newItbis)) };

    const handleInventariableChange = (newInventariable) => { dispatch(setInventariable(newInventariable)) };
    return (
        <Container>
        <GroupContainer>
            <SubTitle>Inventariable:</SubTitle>
            <Radio.Group
                onChange={(e) => handleInventariableChange(e.target.value)}
                value={inventariable}
                style={{ width: '100%' }}
                buttonStyle="solid"
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    {opcionesInventariable.map((opcion, index) => (
                        <Radio.Button 
                            style={{ width: '100%' }} 
                            value={opcion.valor} 
                            key={index}
                        >
                            {opcion.etiqueta}
                        </Radio.Button>
                    ))}
                </Space>
            </Radio.Group>
        </GroupContainer>
        <GroupContainer>
            <SubTitle>ITBIS:</SubTitle>
            <Radio.Group
                onChange={(e) => handleItbisChange(e.target.value)}
                value={itbis}
                style={{ width: '100%' }}
                buttonStyle="solid"
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    {opcionesItbis.map((opcion, index) => (
                        <Radio.Button 
                            style={{ width: '100%' }} 
                            value={opcion.valor} 
                            key={index}
                        >
                            {opcion.etiqueta}
                        </Radio.Button>
                    ))}
                </Space>
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
