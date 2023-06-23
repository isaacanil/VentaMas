import React from 'react'
import { VentaMenuToolbar } from './Page/VentaMenuToolBar'
import { InventoryMenuToolbar } from './Page/InventoryMenuToolbar'
import { toolbarConfig } from './GlobalMenuConfig'
import styled from 'styled-components'

export const GlobalMenu = ({ searchData, setSearchData }) => {
    const renderToolbarComponents = (side) => {
        return toolbarConfig[side].map((config) => {
            const MenuComponent = config.component;
            return <MenuComponent key={config.id} side={config.side} searchData={searchData} setSearchData={setSearchData} />;
        })
    };
    return (
        <Container>
            <LeftSide>{renderToolbarComponents('leftSide')}</LeftSide>
            <RightSide>{renderToolbarComponents('rightSide')}</RightSide>
        </Container>
    );
}
const Container = styled.div`
 width: 100%;
 height: 100px;
    display: flex;
    gap: 1em;
    align-items: center;
    justify-content: space-between;

`
const LeftSide = styled.div`
`
const RightSide = styled.div``