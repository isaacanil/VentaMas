import { Fragment } from "react"
import { FaUser } from "react-icons/fa"
import { useSelector } from "react-redux"
import styled from "styled-components"
import { selectUser } from "../../../features/auth/userSlice"
import { Tooltip } from "../system/Button/Tooltip"
import { MenuLink } from "./MenuLink"
import { UserSection } from "./UserSection"
import { WebName } from "../system/WebName/WebName"
import { getMenuData } from "./MenuData"

export const SideBar = ({ isOpen }) => {
    const user = useSelector(selectUser)
    const links = getMenuData()
    return (
        <Container isOpen={isOpen}>
            <Head>
            <EmptyBox/>
               <WebName></WebName>
            </Head>
            <UserSection user={user}></UserSection>
            <Body>
                <Links>
                    {
                        links.map((item, index) => (
                            <MenuLink item={item} key={index} Items={MenuLink}></MenuLink>
                        ))
                    }
                </Links>
            </Body>
        </Container>
    )
}
const Container = styled.nav`
   
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;

    max-width: 400px;
    width: 100%;
    height: 100vh;

    background-color: rgb(255, 255, 255);
    transform: translateX(-100%);  
    transition: transform 400ms ease;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid rgb(0, 0, 0, 0.1);
    @media (max-width: 600px) {
            max-width: 500px;
            resize: none;
    }
    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: translateX(0px);
                z-index: 9999;
                `
            default:
                break;
        }
    }}
`
const Body = styled.div`
    /* position: relative; */
`
const Links = styled.ul`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    padding: 0;
    gap: 0.6em;`
const Head = styled.div`
   height: 2.75em;
    width: 100%;
    display: flex;
    align-items: center;
    background-color: var(--color);
    position: sticky;
    top: 0;
     
`
const EmptyBox = styled.div`
    height: 2.75em;
    width:4em;
    background-color: var(--color);
    `