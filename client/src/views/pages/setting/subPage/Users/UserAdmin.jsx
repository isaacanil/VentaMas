import styled from "styled-components"
import { FormattedValue } from "../../../../templates/system/FormattedValue/FormattedValue"
import SignUp from "./components/SignUp"
import { Modal } from "../../../../component/modals/Modal"
import { MenuApp } from "../../../../templates/MenuApp/MenuApp"
import SideBar from "./components/SideBar/SideBar"
import { UserList } from "./components/UsersList/UserList"
import { Outlet } from "react-router-dom"

export const UserAdmin = () => {
    return (
        <Container>
            <MenuApp></MenuApp>
            <Wrapper>
                <SideBar />
                <Outlet />
            </Wrapper>
        </Container>
    )
}



const Container = styled.div`
    height: 100vh;
`
const Header = styled.div`
    min-height: 6em;
    padding: 1em;
`
const Wrapper = styled.div`
display:    grid;
grid-template-columns: min-content 1fr;
`