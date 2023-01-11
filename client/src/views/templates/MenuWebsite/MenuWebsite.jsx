import { WebName } from "../system/WebName/WebName"
import { Account, Button } from "../../"
import { ButtonSetting } from "../../../assets"
import Style from './MenuWebsite.module.scss'
import { MdPeople, MdSettings } from "react-icons/md"
import { FaUserCog } from "react-icons/fa"
export const MenuWebsite = () => {
    return (
        <header className={Style.AppContainer}>
            <WebName></WebName>
            <div className={Style.UserSection}>
                {/* <ButtonSetting></ButtonSetting> */}
                <Button 
                    borderRadius={'normal'}
                    width={'icon32'}
                    title={<MdSettings/>}
                />
                
                <Account></Account>

            </div>
        </header>
    )
}