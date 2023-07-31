import React, { Fragment } from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../templates/system/Button/Button'
import { useDispatch } from 'react-redux'
import { toggleAddProductOutflow } from '../../../../../../../features/modals/modalSlice'
import { MenuApp } from '../../../../../..'
import { FormattedValue } from '../../../../../../templates/system/FormattedValue/FormattedValue'

export const Header = () => {
    const dispatch = useDispatch()
    const handleClick = () => {
        dispatch(toggleAddProductOutflow())
    };
    return (
        <span>
            <MenuApp />
            <Container>
                <HeaderWrapper>
                    {/* <Title>Registro de salida de productos</Title> */}
                    <FormattedValue 
                        type={'subtitle'} 
                        value={'Registro de salida de productos'} 
                    />
                    <Button
                        aria-label="Nueva Salida"
                        bgcolor={'primary'}
                        title={'Nueva Salida'}
                        borderRadius={'normal'}
                        onClick={handleClick}
                    />
                </HeaderWrapper>
            </Container>
        </span>
    )
}
const Container = styled.div`
background-color: var(--White);

width: 100%;
padding: 16px;
`;

const HeaderWrapper = styled.div`
max-width: 1000px;
width: 100%;
margin: 0 auto;

display: grid;
align-items: center;
grid-template-columns: 1fr auto;
`
const Title = styled.h2`
  margin: 0;
    font-size: 1.1rem;
`;