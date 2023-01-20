import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useScreenSize } from '../../../hooks/useScreenSize'
import { getCat } from '../../../firebase/firebaseconfig'
import { useEffect } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import { addCategory, deleteCategorySelected } from '../../../features/category/categorySlicer'
import { useDispatch } from 'react-redux'

export const Carrucel = () => {
    const categoriesRef = useRef(null)
    const { width } = useScreenSize(categoriesRef)
    const [categories, setCategories] = useState([])
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
    
    useEffect(() => {
        getCat(setCategories)
    }, [])
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
    width: 100%;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    height: 2.6em;
    padding: 0 1em;
    gap: 1em;
`
const Button = styled.button`
    height: 1.5em;
    width: 1.5em;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    border: 0;
    
    border-radius: 10px;
    outline: 0;
    transition: 500ms background-color ease-in-out;
    :hover{
        background-color: rgba(0, 0, 0, 0.200);
    }
`
const Categories = styled.div`
    border-radius: 10px;
    overflow-x: hidden;
    overflow-x: scroll;
     -webkit-overflow-scrolling: touch;
     scrollbar-width: none; 
    display: flex;
    flex-wrap: nowrap;
    gap: 1em;
    background-color: white;
    ::-webkit-scrollbar {
  display: none; /* Oculta la barra de scroll */
}
`
const CategoryContainer = styled.div`
    height: 2em;
    display: flex;
    align-items: center;
    padding: 0 0.6em;
    background-color: var(--color2);
    white-space: nowrap;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: 500;
    color: rgb(109, 108, 108);
    font-size: 14px;
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