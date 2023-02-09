import { Fragment } from "react"
import { FaUser } from "react-icons/fa"
import { useSelector } from "react-redux"
import styled from "styled-components"
import { selectUser } from "../../../features/auth/userSlice"
import { Tooltip } from "../system/Button/Tooltip"
import { MenuLink } from "./MenuLink"
import { UserSection } from "./UserSection"

export const SideBar = ({ links, isOpen }) => {
    const user = useSelector(selectUser)
    return (
        <Container isOpen={isOpen}>
            <Head>
                <UserSection user={user}></UserSection>
            </Head>
            <Body>
                <Links>
                    {
                        links.map((item, index) => (
                            
                                <MenuLink item={item} key={index}></MenuLink>
                        
                        ))
                    }
                </Links>
            </Body>
        </Container>
    )
}
const Container = styled.nav`
    position: absolute;
    z-index: 100;
    max-width: 400px;
    width: 100%;
    height: calc(100vh - 2.75em);
    top: 2.75em;
    left: 0;
    background-color: rgb(87, 87, 87);
    backdrop-filter: blur(100px);
    transform: translateX(-900px);  
    transition: transform 0.4s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: translateX(0px);
                transition: transform 400ms ease-in-out;
                `


            default:
                break;
        }
    }}
`
const Body = styled.div`
    
`
const Links = styled.ul`
    display: grid;
    padding: 0;
    gap: 0.7em;`
const Head = styled.div`
    padding: 1em;
    margin-bottom: 0.6em;
    
    
`