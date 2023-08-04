import React from 'react'
import styled from 'styled-components';
import { icons } from '../../../../../../../../../constants/icons/icons';
import { FormattedValue } from '../../../../../../../../templates/system/FormattedValue/FormattedValue';
import { SubTitle } from '../../../../../../../checkout/Receipt';

export const FilterSumary = ({ criterio, orden }) => {
    // Mapeo de los valores de 'criterio' a sus descripciones correspondientes
    const criterioDescripcionMap = {
        'nombre': 'Nombre del Producto',
        'categoria': 'Categoría',
        'stock': 'Stock',
        'inventariable': 'Inventariable',
        'costo': 'Costo',
        'precio': 'Precio',
        'impuesto': 'Impuesto',
        // Agrega más según sea necesario
    };

    // Mapeo de los valores de 'orden' a sus descripciones correspondientes
    const ordenDescripcionMap = {
        'asc': icons.operationModes.sortAsc,
        'desc': icons.operationModes.sortDesc,
        'ascNum': icons.operationModes.sortAscNum,
        'descNum': icons.operationModes.sortDescNum,
        'true': 'Sí',
        'false': 'No',
        // Agrega más según sea necesario
    };

    const renderSummary = (criterio, orden) => {
        const criterioText = criterioDescripcionMap[criterio] || 'Criterio desconocido';
        const ordenIcon = ordenDescripcionMap[orden] || 'Orden desconocido';

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
                <Icon>
                    {ordenIcon}
                </Icon>
            </Wrapper>
        );
    };
    return (
        <Container>
            <SubTitle>Resumen: </SubTitle>
            <div>
                 {renderSummary(criterio, orden)}
            </div>
        </Container>
    )
}
const Container = styled.div`
    height: 3em;
    div{

        background-color: var(--White3);
        padding: 0.2em;
    }
    
`
const Icon = styled.div`
    svg{
        height: 1.5em;
        color: gray;
    }
`
const Label = styled.label`
    white-space: nowrap;
`
const Resumen = styled.div`
     display: grid;
     width: min-content;
    
     min-width: 180px;
     gap: 0.2em;
   
`
const Wrapper = styled.div`
    width: fit-content;
    display: grid;
    gap: 1em;
     grid-template-columns: 1fr 2em;
  
`