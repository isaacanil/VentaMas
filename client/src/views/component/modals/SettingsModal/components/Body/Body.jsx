import React from 'react'
import styled from 'styled-components'
import { Container } from '../../../../../templates/system/layout/Container/Container'
import { ConfigMenu } from './components/ConfigMenu'
import Tabs from '../../../../../templates/system/Tabs/Tabs'

export const Body = () => {
    const tabs = [
        { title: 'Tab 1', content: 'Contenido de la pestaña 1' },
        { title: 'Tab 2', content: 'Contenido de la pestaña 2' },
        { title: 'Tab 3', content: 'Contenido de la pestaña 3' },
    ];
    return (
        
        <Tabs
            tabPosition='left'
            tabs={tabs}
        />
    )
}
