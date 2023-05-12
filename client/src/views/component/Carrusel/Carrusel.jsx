import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useScreenSize } from '../../../hooks/useScreenSize'

import { useEffect } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import { addCategory, deleteCategorySelected } from '../../../features/category/categorySlicer'
import { useDispatch } from 'react-redux'
import { Tooltip } from '../../templates/system/Button/Tooltip'
import { useFbGetCategories } from '../../../firebase/categories/useFbGetCategories'

export const Carrusel = () => {
    const categoriesRef = useRef(null)
    const { width } = useScreenSize(categoriesRef)
    const {categories} = useFbGetCategories()

    
    const categoryCardRef = useRef(null)
    const MoveScroll = (direction) => {
        const toStart = () => {
            if (categoriesRef.current.scrollLeft > 0) {
                categoriesRef.current.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                });
              }
          
        }
        const toEnd = () => {
            if(categoriesRef.current.scrollLeft < categoriesRef.current.scrollWidth - categoriesRef.current.clientWidth ){
                categoriesRef.current.scrollTo({
                    top: 0,
                    left: categoriesRef.current.scrollWidth,
                    behavior: 'smooth',
                });
            }
        }
        const toRight = () => {
            const distance = width / 3;
            categoriesRef.current.scrollBy({
                top: 0,
                left: distance,
                behavior: 'smooth'
            })
        }
        const toLeft = () => {
            const distance = width / 3;
            categoriesRef.current.scrollBy({
                top: 0,
                left: -distance,
                behavior: 'smooth'
            })
        }
        if(direction == 'start'){
            toStart()
        }
        if(direction == 'end'){
            toEnd()
        }
        if(direction == 'right'){
            toRight()
        }
        if(direction == 'left'){
            toLeft()
        }
    }
    
 
    return (
        <>
            <Container>
              
                    <Button onClick={() => MoveScroll('left')} onDoubleClick={() => MoveScroll('start')}><MdKeyboardArrowLeft /></Button>

              
                <Categories ref={categoriesRef}>
                    {
                        categories.length > 0 ? (
                            categories.map(({ category }, index) => (
                                <Category category={category} key={index}></Category>
                            ))
                        ) : null

                    }

                </Categories>
                <Button onClick={() => MoveScroll('right')} onDoubleClick={() => MoveScroll('end')} ><MdKeyboardArrowRight /></Button>
            </Container>

        </>
    )
}
const Container = styled.div`
background-color: #ffffff;
    width: 100%;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    height: 2.6em;
    padding: 0 1em;
    gap: 0.4em;
`
const Button = styled.button`
    height: 1.5em;
    width: 1em;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    border: 0;
    background-color: transparent;
    border-radius: var(--border-radius-light);
    outline: 0;
    transition: 500ms background-color ease-in-out;
    :hover{
        background-color: rgba(0, 0, 0, 0.200);
    }
`
const Categories = styled.div`
    border-radius: var(--border-radius-light);
    overflow-x: hidden;
    overflow-x: scroll;
     -webkit-overflow-scrolling: touch;
     scrollbar-width: none; 
    display: flex;
    flex-wrap: nowrap;
    gap: 0.6em;
    background-color: white;
    ::-webkit-scrollbar {
  display: none; /* Oculta la barra de scroll */
}
`
const CategoryContainer = styled.div`
//font & text
font-size: 14px;
letter-spacing: 0.2px;
white-space: nowrap;
//box
height: 2em;
display: flex;
align-items: center;
padding: 0 0.75em;
//color & Ground
background-color: var(--color2);
    border-radius: var(--border-radius);
    text-transform: capitalize;
    font-weight: 500;
    color: rgb(109, 108, 108);
    transition: 300ms ease-in-out;
    :hover{
        background-color: #e7f0fa;
        color: rgb(83, 83, 83);
    }
    ${props => {
        switch (props.selected) {
            case true:
                return `
                    background-color: rgb(111, 185, 245);
                    color: #132241;
                    //order: -1;  
                    // :hover{
                    //     background-color: rgb(111, 185, 245);
                    //     color: white;
                    // }
                `

            default:
                break;
        }
    }}
`
const Category = ({ category, ref }) => {
    const [isSelected, setIsSelected] = useState(false)
    const dispatch = useDispatch()
    const start = (category, ref) => {
        if (isSelected === false) {
            setIsSelected(!isSelected)
            dispatch(addCategory(category))
        }
        if (isSelected) {
            setIsSelected(!isSelected)
            dispatch(
                deleteCategorySelected(category.name)
            )
        }
        setTimeout(()=>{
            ref.current.scrollTo(0, 0)
        }, 100)


    }
    return (
        <CategoryContainer selected={isSelected ? true : false} onClick={(e) => start(category, ref)}>
            {category.name}
        </CategoryContainer>
    )
}