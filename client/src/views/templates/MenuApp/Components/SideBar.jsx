import { Fragment } from "react"
import { motion } from "framer-motion"

import { useSelector } from "react-redux"
import styled from "styled-components"
import { selectUser } from "../../../../features/auth/userSlice"
import { MenuLink } from "./MenuLink"
import { UserSection } from "../UserSection"
import { WebName } from "../../system/WebName/WebName"
import { getMenuData } from "../MenuData/MenuData"
import { Button } from "../../system/Button/Button"
import { icons } from "../../../../constants/icons/icons"
import ROUTES_PATH from "../../../../routes/routesName"
import { useNavigate } from "react-router-dom"
import { SelectSettingCart } from "../../../../features/cart/cartSlice"
const sidebarVariant = {
    open: {
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 450,
            damping: 50,
            restDelta: 2
        }
    },
    closed: {
        x: '-100%',
        transition: {
            type: 'spring',
            stiffness: 450,
            damping: 50,
            restDelta: 2
        }
    }
};
const sidebarTitleGroup = {
    sales: 'Ventas',
    purchase: 'Compras',
    inventory: 'Inventario',
    financialManagement: 'Gestión financiera',
}

export const SideBar = ({ isOpen }) => {
    const user = useSelector(selectUser);
    const { billing: { billingMode } } = useSelector(SelectSettingCart)
    const links = getMenuData();
    const { SETTINGS } = ROUTES_PATH.SETTING_TERM;
    const navigate = useNavigate();

    // Filtrar los enlaces basados en 'key' y 'condition'
    const filteredLinks = links.reduce((acc, item) => {
        // Verificar si el elemento principal tiene una 'key' y una 'condition' y evaluarla
        let includeItem = true;
        if (item.key && item.condition) {
            includeItem = item.condition({ billingMode });
        }

        // Si el elemento no cumple la condición, lo omitimos
        if (!includeItem) {
            return acc;
        }

        // Crear una copia del elemento para evitar mutaciones
        const newItem = { ...item };

        // Si el elemento tiene un 'submenu', aplicamos el filtrado al 'submenu'
        if (item.submenu) {
            const filteredSubmenu = item.submenu.filter(subItem => {
                // Verificar si el subelemento tiene una 'key' y una 'condition' y evaluarla
                if (subItem.key && subItem.condition) {
                    return subItem.condition({ billingMode });
                }
                return true; // Incluir subelementos sin 'key' o sin 'condition'
            });

            // Si después del filtrado hay elementos en el 'submenu', lo asignamos
            if (filteredSubmenu.length > 0) {
                newItem.submenu = filteredSubmenu;
            } else {
                // Si no hay elementos en el 'submenu', eliminamos la propiedad 'submenu'
                delete newItem.submenu;
            }
        }

        // Añadir el elemento filtrado al acumulador
        acc.push(newItem);
        return acc;
    }, []);

    // Agrupar los enlaces filtrados por 'group'
    const groupedLinks = filteredLinks.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = [];
        }
        acc[item.group].push(item);
        return acc;
    }, {});

    const handleGoToSetting = () => {
        navigate(SETTINGS)
    }

    return (
        <Container
            variants={sidebarVariant}
            initial='closed'
            animate={isOpen ? 'open' : 'closed'}
        >
            <Wrapper>
                <Head>
                    <div>
                        <EmptyBox />
                        <WebName></WebName>
                    </div>
                    <Button
                        startIcon={icons.operationModes.setting}
                        color='info'
                        size='icon32'
                        borderRadius='normal'
                        onClick={handleGoToSetting}
                    />
                </Head>
                <UserSection user={user}></UserSection>
                <Body>
                    <Links>
                        {Object.keys(groupedLinks).map(group => (
                            <Group key={group}>
                                {/* {groupedLinks[group].length > 1 && <GroupTitle>{sidebarTitleGroup[group]}</GroupTitle>} */}
                                <MenuLinkList>
                                    {groupedLinks[group].map((item, index) => (
                                        <MenuLink item={item} key={index}></MenuLink>
                                    ))}
                                </MenuLinkList>
                            </Group>
                        ))}
                    </Links>
                </Body>
            </Wrapper>
        </Container>
    )
}

const Container = styled(motion.div)`
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;

    /*Box */
    max-width: 400px;
    width: 100%;
    height: 100vh;

    border-radius: 10px;
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;

    overflow: hidden;
    transform: translateX(-100%); 
    transition: transform 400ms ease;
    background-color: ${props => props.theme.bg.shade};  
    border-right: 1px solid rgb(0, 0, 0, 0.1);
    box-shadow: 5px 0 5px rgba(0, 0, 0, 0.1), 10px 0 5px rgba(0, 0, 0, 0.05);
`
const Wrapper = styled.div`
    /*Box */
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    grid-template-rows: min-content min-content 1fr;
    @media (max-width: 600px) {
            max-width: 500px;
            resize: none;
    }
   
`
const Body = styled.div`
    /* position: relative; */
    background-color: ${props => props.theme.bg.color2}; 
    padding: 0.8em;
    overflow-y: auto;
`

const Links = styled.ul`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    padding: 0;
    gap: 0.6em;

    `
const Group = styled.div`
    /* background-color: ${props => props.theme.bg.shade}; */
    /* border-radius: var(--border-radius); */
    /* border: 1px solid rgb(0, 0, 0, 0.1); */
    overflow: hidden;
`
const MenuLinkList = styled.div`
    background-color: ${props => props.theme.bg.shade};
    border-radius: var(--border-radius);
    border: 1px solid rgb(0, 0, 0, 0.1);
    overflow: hidden;
`
const GroupTitle = styled.h3`
    /* Estilos para el título del grupo */
    font-size: 14px;
    font-weight: 500;
    padding: 0.5em 0.8em;
    margin: 0;  
  
    color: #505050;

`;
const Head = styled.div`
   height: 2.75em;
    width: 100%;
    padding: 1em 0.4em 1em 1em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${props => props.theme.bg.color}; 
    position: sticky;
    top: 0;

    div{
        display: flex;
        align-items: center;
    }
     
`
const EmptyBox = styled.div`
    height: 2.75em;
    width:3em;
    background-color: ${props => props.theme.bg.color}; 
    `