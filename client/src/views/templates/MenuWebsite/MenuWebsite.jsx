import { WebName } from "../system/WebName/WebName"
import { Account, Button } from "../../"
import { ButtonSetting } from "../../../assets"
import { MdPeople, MdSettings } from "react-icons/md"
import { FaUserCog } from "react-icons/fa"
import ROUTES_PATH from "../../../routes/routesName"
import { useNavigate } from "react-router-dom"
import styled from "styled-components"
import { icons } from "../../../constants/icons/icons"

export const MenuWebsite = () => {
    const navigate = useNavigate()
    const { SETTINGS } = ROUTES_PATH.SETTING_TERM
    const handleSetting = () => navigate(SETTINGS)

    return (
        <Container>
            <WebName></WebName>
            <UserSection>
                <Button
                    borderRadius={'normal'}

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
    gap: 0.6em;
`