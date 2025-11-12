import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import styled from "styled-components"

import { icons } from "../../../constants/icons/icons"
import { useDialog } from "../../../Context/Dialog"
import { logout, selectUser } from "../../../features/auth/userSlice"
import { fbSignOut } from "../../../firebase/Auth/fbAuthV2/fbSignOut"
import ROUTES_PATH from "../../../routes/routesName"
import { NotificationButton } from "../MenuApp/Components/NotificationButton/NotificationButton"
import { Button } from "../system/Button/Button";
import { WebName } from "../system/WebName/WebName"

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
            <LeftSection>
                <WebName/>
                <NotificationButton />
            </LeftSection>
            <UserSection>
                <Button
                    title={icons.operationModes.logout}
                    // color={'gray-contained'}
                    // title={'Salir'}
                    width={'icon32'}
                    onClick={logoutOfApp}
                />
                {user?.role !== 'cashier' && (
                    <Button
                        width={'icon32'}
                        title={icons.operationModes.setting}
                        onClick={handleSetting}
                    />
                )}
            </UserSection>
        </Container>
    )
}
const Container = styled.div`

    height: 2.75em;
    color: white;
    background-color: var(--color);
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
    gap: 0.8em;
`

const LeftSection = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
    min-width: 0;
    
    & > * {
        min-width: 0;
    }
`
const UserSection = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
`
