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
import { motion } from "framer-motion"
const sidebarVariant = {
    open: {
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 350,
            damping: 30,
            restDelta: 2
        }
    },
    closed: {
        x: '-100%',
        transition: {
            type: 'spring',
            stiffness: 350,
            damping: 30,
            restDelta: 2
        }
    }
};
export const SideBar = ({ isOpen }) => {
    const user = useSelector(selectUser);
    const links = getMenuData();
    const groupedLinks = links.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {});
   
    return (
        <Container
            variants={sidebarVariant}
            initial='closed'
            animate={isOpen ? 'open' : 'closed'}
        >
            <Head>
                <EmptyBox />
                <WebName></WebName>
            </Head>
            <UserSection user={user}></UserSection>
            <Body>
                <Links>
                    {
                        Object.keys(groupedLinks).map(group => (
                            <Group key={group}>
                                {/*<GroupTitle>{group}</GroupTitle>*/}
                                {groupedLinks[group].map((item, index) => (
                                    <MenuLink item={item} key={index}></MenuLink>
                                ))}
                            </Group>
                        ))
                    }
                </Links>
            </Body>
        </Container>
    )
}
const Container = styled(motion.div)`
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
    display: grid;
    grid-template-rows: min-content min-content 1fr;
    border-right: 1px solid rgb(0, 0, 0, 0.1);
    @media (max-width: 600px) {
            max-width: 500px;
            resize: none;
    }
   
`
const Body = styled.div`
    /* position: relative; */
    background-color: var(--color2);
    padding: 0.8em;
`

const Links = styled.ul`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    padding: 0;
    gap: 0.6em;

    `
const Group = styled.div`
    background-color: white;
    border-radius: var(--border-radius);
    overflow: hidden;
`
const GroupTitle = styled.h3`
    /* Estilos para el título del grupo */
`;
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