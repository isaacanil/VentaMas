import React from 'react'
import Style from './Setting.module.scss'
import { Link } from 'react-router-dom'
import { IoSettingsSharp } from 'react-icons/io5'
export const ButtonSetting = () => {
    return (
        <div className={Style.Item_container}>
            <Link className={Style.Item_inner} to='/app/setting'>
                <div className={Style.Icon_container}>
                <IoSettingsSharp></IoSettingsSharp>
                </div> 
            </Link>
        </div>
    )
}
