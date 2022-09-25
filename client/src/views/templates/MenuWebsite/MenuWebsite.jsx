import { WebName } from "../system/WebName/WebName"
import { Account } from "../../"
import { SettingIcon } from "../../../assets"
import Style from './MenuWebsite.module.scss'
export const MenuWebsite = () => {
    return (
        <header className={Style.AppContainer}>
            <WebName></WebName>
            <div className={Style.UserSection}>
                <Account></Account>
                <SettingIcon></SettingIcon>

            </div>
        </header>
    )
}