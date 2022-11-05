import React from 'react'
import Style from './MenuComponents.module.scss'
import { Button } from './../../index'
export const MenuComponents = () => {
    return (
        <div className={Style.ComponentContainer}>
            <ul className={Style.Items}>
                {/* <li className={Style.Item}>
                    <Button 
                    title='Display'>
                        Displays
                    </Button>
                </li> */}
                <li className={Style.Item}>
                    <Button title='Productos'/>        
                </li>
                <li className={Style.Item}>
                    <Button title='Factura'/>
                </li>

            </ul>

        </div>
    )
}
