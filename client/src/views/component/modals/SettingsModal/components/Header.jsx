import React from 'react'
import styled from 'styled-components'

import Typography from '../../../../templates/system/Typografy/Typografy'
import { Button } from '../../../..'
import { icons } from '../../../../../constants/icons/icons'

/**
 *
 *
 * @param {*} {title = "Settings"}
 * @return {*} 
 */
export const Header = ({ config }) => {
    const { title = "Settings" } = config;
    return (
        <Container
            

        >
            <Typography
                variant={'h2'}
                disableMargins
            >
                {title}
            </Typography>
            <Button
                title={icons.operationModes.close}
                width='icon16'
                borderRadius='round'
                bgcolor='neutro'
            />

        </Container>
    )
}
const Container = styled.div`
    height: 2.6em;
    display: grid;
    padding: 0 1em;
    align-items: center;
    grid-template-columns: 1fr min-content;
    border-bottom: ${props => props.theme.border.base};
`