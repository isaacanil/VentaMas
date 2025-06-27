import { motion } from "framer-motion"
import { useSelector, useDispatch } from "react-redux"
import styled from "styled-components"
import { selectUser } from "../../../../features/auth/userSlice"
import { selectBusinessData } from "../../../../features/auth/businessSlice"
import { MenuLink } from "./MenuLink"
import { UserSection } from "../UserSection"
import { WebName } from "../../system/WebName/WebName"
import { getMenuData } from "../MenuData/MenuData"
import { Button } from "../../system/Button/Button"
import { icons } from "../../../../constants/icons/icons"
import ROUTES_PATH from "../../../../routes/routesName"
import { useNavigate } from "react-router-dom"
import { SelectSettingCart } from "../../../../features/cart/cartSlice"
import { openNotificationCenter } from "../../../../features/notification/notificationCenterSlice"

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

export const SideBar = ({ isOpen, handleOpenMenu }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const business = useSelector(selectBusinessData);
    const { billing: { billingMode } } = useSelector(SelectSettingCart);
    const businessType = business?.businessType || null;
    const links = getMenuData();
    const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM;
    const navigate = useNavigate();    // Filtrar los enlaces basados en 'key' y 'condition'
    const filteredLinks = links.reduce((acc, item) => {
        // Verificar si el elemento principal tiene una 'key' y una 'condition' y evaluarla
        let includeItem = true;
        if (item.key && item.condition) {
            includeItem = item.condition({ billingMode, businessType });
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
        navigate(GENERAL_CONFIG_BUSINESS);
    }

    const handleOpenNotifications = () => {
        dispatch(openNotificationCenter('taxReceipt'));
        handleOpenMenu()
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
                    <ButtonGroup>
                        <Button
                            startIcon={icons.system.notification}
                            color='info'
                            size='icon32'
                            borderRadius='normal'
                            onClick={handleOpenNotifications}
                        />
                        <Button
                            startIcon={icons.operationModes.setting}
                            color='info'
                            size='icon32'
                            borderRadius='normal'
                            onClick={handleGoToSetting}
                        />
                    </ButtonGroup>
                </Head>
                <UserSection user={user}></UserSection>
                <Body>
                    <Links>
                        {Object.keys(groupedLinks).map(group => (
                            <Group key={group}>
                                {/* <GroupTitle>{group}</GroupTitle> */}
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
    z-index: 9900;
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

const ButtonGroup = styled.div`
    display: flex;
    gap: 0.4em;
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
export const Group = styled.div`
    overflow: hidden;
`
export const MenuLinkList = styled.div`
    background-color: ${props => props.theme.bg.shade};
    border-radius: var(--border-radius);
    padding: 0.2em;
    border: 1px solid rgb(0, 0, 0, 0.1);
    overflow: hidden;
  
`
const Head = styled.div`
   height: 2.75em;
    width: 100%;
    padding: 1em 1em 1em;
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