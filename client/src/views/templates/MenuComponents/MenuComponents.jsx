import React from 'react'
import Style from './MenuComponents.module.scss'
import { Button } from './../../index'
export const MenuComponents = () => {
    return (
        <div className={Style.ComponentContainer}>
            <ul className={Style.Items}>
                <li className={Style.Item}>
                    <Button>
                        Displays
                    </Button>
                </li>
                <li className={Style.Item}>
                    <Button>
                        Productos
                    </Button>
                </li>
                <li className={Style.Item}>
                    <Button>
                        Factura
                    </Button>
                </li>

            </ul>

        </div>
    )
}
