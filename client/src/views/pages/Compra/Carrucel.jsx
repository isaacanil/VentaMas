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
    const MoveScroll = () => {
        const toStart = () => {
            categoriesRef.current.scroll(0, 0)
        }
        const toEnd = () => {
            categoriesRef.current.scroll(0,0)
        }
        const toRight = () => {
            categoriesRef.current.scrollBy({
                top: 0,
                left: 120,
                behavior: 'smooth'
            })
        }
        const toLeft = () => {
            categoriesRef.current.scrollBy({
                top: 0,
                left: -120,
                behavior: 'smooth'
            })
        }
        return {
            toStart,
            toEnd,
            toRight,
            toLeft
        }
    }
    
    useEffect(() => {
        getCat(setCategories)
    }, [])
    return (
        <>
            <Container>
                <Button onClick={() => MoveScroll().toLeft()} onDoubleClick={() => MoveScroll().toStart}><MdKeyboardArrowLeft /></Button>
                <Categories ref={categoriesRef}>
                    {
                        categories.length > 0 ? (
                            categories.map(({ category }, index) => (
                                <Category category={category} fn={
                                    MoveScroll().toStart()
                                } key={index}></Category>
                            ))
                        ) : null

                    }

                </Categories>
                <Button onClick={() => MoveScroll().toRight()} ><MdKeyboardArrowRight /></Button>
            </Container>

        </>
    )
}
const Container = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
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
    
    border-radius: 100px;
    outline: 0;
    transition: 500ms background-color ease-in-out;
    :hover{
        background-color: rgba(0, 0, 0, 0.200);
    }
`
const Categories = styled.div`
    border-radius: 10px;
    overflow-x: hidden;
    display: flex;
    flex-wrap: nowrap;
    gap: 1em;
    background-color: white;
`
const CategoryContainer = styled.div`
    height: 2em;
    display: flex;
    align-items: center;
    padding: 0 0.6em;
    background-color: var(--icolor3);

    white-space: nowrap;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: 500;
    color: rgb(43, 42, 42);
    font-size: 14px;
    transition: 300ms ease-in-out;
    transition-property: all;
    :hover{
        background-color: #d4dce4;
    }
    ${props => {
        switch (props.selected) {
            case "true":
                return `
                    background-color: rgb(111, 185, 245);
               
                    order: -1;  
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
            dispatch(
                addCategory(category)
            )
            setTimeout(() => {
                ref.current.scroll(0, 0)
            }, 1000)
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
        <CategoryContainer selected={isSelected ? "true" : "false"} onClick={(e) => start(category, ref)}>
            {category.name}
        </CategoryContainer>
    )
}