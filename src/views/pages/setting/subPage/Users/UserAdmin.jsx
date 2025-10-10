import { Outlet } from "react-router-dom"
import styled from "styled-components"

import { MenuApp } from "../../../../templates/MenuApp/MenuApp"

export const UserAdmin = () => {
    return (
        <Container>
            <MenuApp sectionName={'Lista de Usuarios'} />
            <Outlet />
        </Container>
    )
}

const Container = styled.div`
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
`
