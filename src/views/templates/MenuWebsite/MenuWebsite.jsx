import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import styled, { css } from "styled-components"

import { icons } from "../../../constants/icons/icons"
import { useDialog } from "../../../Context/Dialog"
import { logout, selectUser } from "../../../features/auth/userSlice"
import { fbSignOut } from "../../../firebase/Auth/fbAuthV2/fbSignOut"
import ROUTES_PATH from "../../../routes/routesName"
import { AppVersionBadge } from "../../pages/Home/components/AppVersionBadge/AppVersionBadge"
import PersonalizedGreeting from "../../pages/Home/components/PersonalizedGreeting/PersonalizedGreeting"
import { NotificationButton } from "../MenuApp/Components/NotificationButton/NotificationButton"

export const MenuWebsite = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const { onClose, setDialogConfirm } = useDialog();
    const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM
    const handleSetting = () => navigate(GENERAL_CONFIG_BUSINESS)

    const handleLogout = () => {
        dispatch(logout());
        fbSignOut();
        navigate('/login', { replace: true });
    }

    const logoutOfApp = () => {
        // dispatch to the store with the logout action
        setDialogConfirm({
            title: 'Cerrar sesión',
            isOpen: true,
            type: 'warning',
            message: '¿Está seguro que desea cerrar sesión?',
            onConfirm: () => {
                handleLogout()
                onClose()
            }
        })
    }

    return (
        <Container>
               <UserSection>
                <ActionButtons>
                    <StyledNotificationButton
                        aria-label="Centro de notificaciones"
                    />
                    {user?.role !== 'cashier' && (
                        <ActionIconButton
                            type="button"
                            aria-label="Configuración del negocio"
                            onClick={handleSetting}
                        >
                            {icons.operationModes.setting}
                        </ActionIconButton>
                    )}
                </ActionButtons>
            </UserSection>
            
            <CenterSection>
                <BrandName>Ventamax</BrandName>
            </CenterSection>
            <GreetingSection>
                <PersonalizedGreeting />
                    <ActionIconButton
                        type="button"
                        aria-label="Cerrar sesión"
                        onClick={logoutOfApp}
                    >
                        {icons.operationModes.logout}
                    </ActionIconButton>
            </GreetingSection>
         
        </Container>
    )
}
const Container = styled.header`
    position: sticky;
    top: 0.1rem;
    z-index: 100;
    width: min(1200px, calc(100% - 2rem));
    margin: 0.1rem auto 0;
    padding: 0.3rem 0.5rem;
    border-radius: 100px;
    background: rgba(66, 164, 245, 1);
    backdrop-filter: blur(10px);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8em;
    flex-wrap: wrap;
    row-gap: 0.75rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(6px);
`

const GreetingSection = styled.div`
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-start;
    min-width: 200px;
    order: 3;
    align-items: center;
    gap: 0.5rem;


`

const CenterSection = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 1;


`

const BrandName = styled.span`
    font-family: "Inter", "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: clamp(1.3rem, 3vw, 1.4rem);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.92);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.15rem 0.65rem;

    @media (max-width: 768px) {
        display: none;
    }
`

const UserSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    flex: 0 0 auto;
    min-width: 180px;
    order: 3;
`

const ActionButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;

    @media (max-width: 768px) {
        justify-content: flex-start;
    }
`

const VersionBadgeWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 0.1rem;

    @media (max-width: 768px) {
        justify-content: flex-start;
    }
`

const iconButtonStyles = css`
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: none;
    background: rgba(15, 23, 42, 0.2);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    backdrop-filter: blur(10px);
    outline: none;

    &:hover {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.6);
        transform: translateY(-1px);
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.24);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.9);
        outline-offset: 2px;
    }

    svg {
        font-size: 1.05rem;
    }
`

const StyledNotificationButton = styled(NotificationButton)`
    && {
        ${iconButtonStyles}
    }
`

const ActionIconButton = styled.button`
    ${iconButtonStyles}
`
