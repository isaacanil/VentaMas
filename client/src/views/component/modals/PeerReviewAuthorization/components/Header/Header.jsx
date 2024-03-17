import React from 'react'
import { FormattedValue } from '../../../../../templates/system/FormattedValue/FormattedValue'

import { Logo } from '../../../../../../assets/logo/Logo'
import styled from 'styled-components'
export const Header = () => {
    return (
        <Component>
            <Logo />
            <Description>
                <FormattedValue
                    value={'Confirmación de Usuario autorizado'}
                    type={'subtitle'}
                />
                <FormattedValue
                    value={'Permite a un segundo usuario autorizar la apertura de la caja después de una revisión.'}
                    type={'paragraph'}
                    size={'xsmall'}
                />
            </Description>
        </Component>
    )
}
const Component = styled.div`
display: grid;
gap: 1em;
row-gap: 1.4em;
 grid-template-columns: min-content 1fr;
 
`
const Description = styled.div`
display: grid;
gap: 0.5em;
padding-right: 0.5em;
`