import React from 'react'
import Style from './MenuComponents.module.scss'
import { Button } from './../../index'
import styled from 'styled-components'
import { MenuConfig } from './MenuConfig'
import { useDispatch } from 'react-redux'
export const MenuComponents = () => {
   const dispatch = useDispatch()
    return (
        <Container>
            <Items>
                {/* <li className={Style.Item}>
                    <Button 
                    title='Display'>
                        Displays
                    </Button>
                </li> */}
                {
                    MenuConfig.map((item, index) => {
                        return (
                            <Item key={index}>
                                <Button
                                    bgcolor={item?.bgcolor}
                                    startIcon={item.icon}
                                    title={item.title}
                                    icon={item.icon}
                                    onClick={() => item.onclick(dispatch)}
                                />
                            </Item>
                        )
                    })
                }
                {/* <Item>
                    <Button title='Productos'/>        
                </Item>
                <Item className={Style.Item}>
                    <Button title='Factura'/>
                </Item> */}

            </Items>

        </Container>
    )
}
const Container = styled.div`   
    display: none;
    
    @media(max-width: 800px) {
        height: 3em;
        width: 100%;
        background-color: rgba(255, 255, 255, 0.541);
        backdrop-filter: blur(10px);
        overflow: hidden;
        display: flex;
        z-index: 1;
      
        align-items: center;
        padding: 0 2em;
      
    }
`
const Items = styled.ul`
     display: flex;
        width: 100%;
        list-style: none;
        justify-content: space-between;
        margin: 0;
        padding: 0;
        @media(max-width: 800px) {
            display: flex;
            width: 100%;
            list-style: none;
            justify-content: space-between;
            margin: 0;
            padding: 0;
    }
`
const Item = styled.li`

    ${props => props.align === 'right' ? 'justify-self: end;' : ''}

`