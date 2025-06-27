import { WebName } from "../system/WebName/WebName"
import { Account, Button } from "../../"
import ROUTES_PATH from "../../../routes/routesName"
import { useNavigate } from "react-router-dom"
import styled from "styled-components"
import { icons } from "../../../constants/icons/icons"
import { useDialog } from "../../../Context/Dialog/DialogContext"
import { useDispatch } from "react-redux"
import { logout } from "../../../features/auth/userSlice"
import { fbSignOut } from "../../../firebase/Auth/fbAuthV2/fbSignOut"

export const MenuWebsite = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { dialog, onClose, setDialogConfirm } = useDialog();
    const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM
    const handleSetting = () => navigate(GENERAL_CONFIG_BUSINESS)

    const handleLogout = () => {
        dispatch(logout());
        fbSignOut();
        navigate('/', { replace: true });
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
            <WebName></WebName>
            <UserSection>
                <Button
                    title={icons.operationModes.logout}
                    // color={'gray-contained'}
                    // title={'Salir'}
                    width={'icon32'}
                    onClick={logoutOfApp}
                />
                <Button
                    width={'icon32'}
                    title={icons.operationModes.setting}
                    onClick={handleSetting}
                />
            </UserSection>
        </Container>
    )
}
const Container = styled.div`

    height: 2.75em;
    color: white;
    background-color: var(--color);
    margin: 0;
    display: grid;
    align-items: center;
    grid-template-columns: 1fr auto;
    padding: 0 1em;
    .UserSection{
        
    }
`
const UserSection = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
`