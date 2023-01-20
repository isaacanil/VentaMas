import React, { Fragment, useEffect, useState } from 'react'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { MdArrowForward } from 'react-icons/md'
import styled from 'styled-components'
import { useSearchFilterOrderMenuOption } from '../../../../../../hooks/useSearchFilter'

import { Input } from './Input'
import { modifyOrderMenuData } from './modifyOrderMenuData'

export const Item = ({ data, array, setArray, index }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const optionsFiltered = useSearchFilterOrderMenuOption(data, searchTerm)

    const [isItemOpen, setIsItemOpen] = useState(false)
    const handleOpenItem = () => setIsItemOpen(!isItemOpen)
    return (
        <Container>
            <Head onClick={handleOpenItem}>
                <IoIosArrowForward /> <span>{data.name}</span>
            </Head>
            <Body isOpen={isItemOpen ? true : false} index={index}>
                {
                    <Fragment>
                        <Input data={data} onChange={(e) => setSearchTerm(e.target.value)} fn={() => setSearchTerm('')} />
                        <Items>
                            {
                                optionsFiltered.map((item, subIndex) => (
                                    subIndex <= 2 ? (
                                        <FilterOption key={subIndex}  isSelected={item.selected ? true : false}>
                                            <input type="checkbox" name="selected" id={subIndex} onChange={(e) => {
                                                modifyOrderMenuData(array, setArray, index, 'Items', 'selected', subIndex, e.target.checked)
                                            }} />
                                            <label htmlFor={subIndex}>
                                                {item.name}
                                            </label>
                                        </FilterOption>
                                    ) : null
                                    
                                ))
                            }
                             {data.Items.length > 4 && <button>See More</button>}

                        </Items>
                    </Fragment>
                }
            </Body>
        </Container>
    )
}
const Container = styled.div`
    
`
const Body = styled.div`
height: auto;
background-color: rgb(242, 242, 242);
padding: 0.4em 1em;
gap: 1em;
display: grid;
transition: height transform 2s ease-in-out;
    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: translate(0, 0px);
                background-color: rgb(242, 242, 242);
                padding: 0.4em 1em;
                position: relative;
                height: auto;
                z-index: 1;
                display: grid;
                gap: 1em;
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 0s, 400ms;
                transition-timing-function: easy-in-out;
                `

            case false:
                return `   
                transform: translate(0, -500px);  
                position: absolute; 
                height: 0px;
                z-index: ${-(props.index + 3) };
                width: 100%;   
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 100ms, 0ms;
                transition-timing-function: easy-in-out, lineal;
        `

            default:
                break;
        }
    }}
`


const Head = styled.div`
height: 2em;
    display: grid;
    align-items: center;
    gap: 1em;
    grid-template-columns: min-content 1fr;
    background-color: var(--White);
    padding: 0 1em;
`
const Items = styled.ul`
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.4em;
   
    
`
const FilterOption = styled.li`

        grid-template-columns: min-content 1fr;
        gap: 1em;
        padding: 0.2em 0.6em;
        border-radius: 0.4em;
        background-color: rgb(254, 254, 254);
        position: relative;
        display: grid;
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