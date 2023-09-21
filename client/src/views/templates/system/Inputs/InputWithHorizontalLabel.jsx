import React from 'react'
import styled from 'styled-components'
import { InputV4 } from './GeneralInput/InputV4'
import { FormattedValue } from '../FormattedValue/FormattedValue'

export const InputWithHorizontalLabel = ({ label = null, ...props }) => {
    return (
        <Container label={label} >
            {label && <FormattedValue
                size={'small'}
                type={'title'}
                {...props}
                // align={'right'}
                value={label}
            />}
            <InputV4
                {...props}
            />
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    align-items: center;
    align-content: center;
    padding: 0 0.4em ;
    gap: 1em;
    ${label => label && `
        grid-template-columns: 8em 1fr;
    `}
   
`
