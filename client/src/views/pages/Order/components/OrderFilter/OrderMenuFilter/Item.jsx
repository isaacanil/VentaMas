import React, { Fragment, useEffect, useState } from 'react'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { MdArrowForward } from 'react-icons/md'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { handleOpenOptions } from '../../../../../../features/order/ordersSlice'
import { useSearchFilter, useSearchFilterOrderMenuOption } from '../../../../../../hooks/useSearchFilter'
import { Button } from '../../../../../templates/system/Button/Button'
import { Input } from './Input'
import { modifyOrderMenuData } from './modifyOrderMenuData'

export const Item = ({ data, index, propertyName }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const dispatch = useDispatch()
    const { Items } = data
    console.log(propertyName)
    const optionsFiltered = useSearchFilterOrderMenuOption(Items, searchTerm)

    const [isItemOpen, setIsItemOpen] = useState(false)
    // const handleOpenItem = () => setIsItemOpen(!isItemOpen)
    const handleOpenItem = (id) => dispatch(handleOpenOptions({ id }))

    return (
        <Container>
            <Head isOpen={data.isOpen ? true : false} onClick={() => handleOpenItem(data.id)}>
                <IoIosArrowForward /> <span>{data.name}</span>
            </Head>
            <Body isOpen={data.isOpen ? true : false} index={index}>
                <Input data={data} onChange={(e) => setSearchTerm(e.target.value)} fn={() => setSearchTerm('')} />
                <OptionFilterList>
                    {
                        optionsFiltered.map((item, subIndex) => (
                            subIndex <= 2 ? (
                                <FilterOption key={subIndex} isSelected={item.selected ? true : false}>
                                    <input type="checkbox" name="selected" id={subIndex} />
                                    <label htmlFor={subIndex}>
                                        {item.name}
                                    </label>
                                </FilterOption>
                            ) : null

                        ))
                    }
                    {optionsFiltered.length === 0 ? <span>No encontrado</span> : null}
                    {data.Items.length > 3 && <Button title='ver más'/>}

                </OptionFilterList>
            </Body>
        </Container>
    )
}
const Container = styled.div`
    
`


const Body = styled.div`

height: 100%;
background-color: rgb(242, 242, 242);
padding: 0.4em 1em;
gap: 1em;
display: grid;
align-items: flex-start;
transform: translate(0, 0px);
padding: 0.4em 1em;
position: relative;
height: auto;
z-index: 1;
gap: 1em;
animation: delay 1s;
transition-property: transform, z-index;
transition-duration: 400ms, 400ms;
transition-delay: 0s, 400ms;
transition-timing-function: easy-in-out;

    ${props => {
        switch (props.isOpen) {
            case true:
                return `

                `

            case false:
                return `   
                transform: translate(0, -700px);  
                position: absolute; 
                z-index: ${-(props.index + 3)};
                width: 100%;   
                transition-property: transform, z-index;
                transition-duration: 2s, 400ms;
                transition-delay: 100ms, 0ms;
                transition-timing-function: easy-in-out, lineal;
        `

            default:
                break;
        }
    }}
`


const Head = styled.div`
height: 2.7em;
    display: grid;
    align-items: center;
    gap: 1em;
    grid-template-columns: min-content 1fr;
    background-color: var(--White);
    padding: 0 1em;
    ${props => {
        switch (props.isOpen) {
            case true:
                return`
                background-color: var(--color);
                `
              
        
            default:
                break;
        }
    }}
`
const OptionFilterList = styled.ul`
    list-style: none;
    padding: 0;
    display: grid;
    
    gap: 0.4em;
   
    
`
const FilterOption = styled.li`
        display: grid;
        grid-template-columns: min-content 1fr;
        align-items: center;
        height: 2.4em;
        gap: 1em;
        padding: 0em 0.6em;
        border-radius: 0.4em;
        background-color: rgb(254, 254, 254);
        position: relative;
        ${props => {
        switch (props.isSelected) {
            case true:
                return `
                    background-color: rgb(34, 106, 201);
                    
                    `
            case false:
                return `
                    background-color: rgb(254, 254, 254);
                  
                    `

            default:
                break;
        }
    }}
`