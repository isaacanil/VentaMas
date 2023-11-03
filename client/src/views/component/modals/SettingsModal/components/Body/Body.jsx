import React from 'react'
import styled from 'styled-components'
import { ConfigMenu } from './components/ConfigMenu'
import Tabs from '../../../../../templates/system/Tabs/Tabs'
// import { ColorPairs } from '../../../../../../theme/ColorPalette'

export const Body = () => {
    const tabs = [
        {
            title: 'Tab 1', content: (
                <Container>
                 
                </Container>
            )
        },
        { title: 'Tab 2', content: "prueba" },
    ];
    return (

        <Tabs
            tabPosition='left'
            tabs={tabs}
        />
    )
}



const Container = styled.div`
  
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
    background: #ffffff;
    `