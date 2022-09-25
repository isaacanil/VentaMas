import React from 'react'
import { useState } from 'react'
import styled from 'styled-components'
import { ArrowLeftButton, ArrowRightButton } from '../../'


export const CategoryBar = () => {
    const category = [
        {
            name: 'Bebidas'
        },
        {
            name: 'Dieta y Nutrición'
        },
        {
            name: 'Comestibles'
        },
        {
            name: 'Vestidos'
        },
        {
            name: 'Higiene y Bienestar'
        },
        {
            name: 'Hogar'
        },
        {
            name: 'Fitness'
        },
        {
            name: 'Frutas y Verduras'
        },
        {
            name: 'Bebé'
        }
    ]
    const [focusItem, setFocusItem] = useState(0)
    const count = category.length
    console.log(focusItem)
    const next = () => {
        console.log('1')
        if (focusItem < (count - 1)) {
            setFocusItem(focusItem + 1)
        }
    }
    const prev = () => {
        if (focusItem > 0) {
            setFocusItem(focusItem - 1)
        }
    }
    return (
        <CategoryContainer>
            <ArrowLeftButton funct={prev}></ArrowLeftButton>
            <CategoryItems>
                <CategoryWrapper style={{ transform: `translateX(-${focusItem * 100}%)` }}>


                    {
                        category.length > 0 ? (
                            category.map((cat, index) => (

                                <li key={index} >
                                    {cat.name}
                                </li>
                            ))
                        ) : null
                    }


                </CategoryWrapper>
            </CategoryItems>
            <ArrowRightButton funct={next}></ArrowRightButton>
        </CategoryContainer>
    )
}
const CategoryContainer = styled.div`
  background-color: rgb(243,243,243);
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.100);
  gap: 0.5em;
  align-items: center;
  justify-content: center;
  width: 500px;
  padding: 0 0.5em;
  height: 2.2em;
  border-radius: 50px;
`
const CategoryItems = styled.div`
   

    display: flex;
    gap: 0.4em;
    width: 400px;
    overflow: hidden;
`
const CategoryWrapper = styled.ul`
    width: 100%;
    height: 2.2em;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 0.5em;
    list-style: none;
    z-index: 100;
    li{
        width: 10em;
        min-width: 8em;
        background-color: #88b5da;
        color: #4b4b4b;
        font-weight: 500;
        height: 1.6em;
        padding: 0 0.4em;
        border-radius: 50px;
        justify-content: center;
        display: flex;
        align-items: center;
        white-space: nowrap;
    }
`
const Button = styled.button`
`