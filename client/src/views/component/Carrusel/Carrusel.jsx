import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useScreenSize } from '../../../hooks/useScreenSize'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { useFbGetCategories } from '../../../firebase/categories/useFbGetCategories'
import { motion } from 'framer-motion'
import { Category } from './Category'
import { toggleAddCategory } from '../../../features/modals/modalSlice'
import { icons } from '../../../constants/icons/icons'
import { SelectCategoryList } from '../../../features/category/categorySlicer'
import { useCategoryState } from '../../../Context/CategoryContext/CategoryContext'

export const Carrusel = ({
    themeColor,
    addCategoryBtn = false
}) => {
    const categoriesRef = useRef(null)
    const { width } = useScreenSize(categoriesRef)
    const { categories } = useFbGetCategories()
    const dispatch = useDispatch()
    const categorySelected = useSelector(SelectCategoryList)
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
            if (categoriesRef.current.scrollLeft < categoriesRef.current.scrollWidth - categoriesRef.current.clientWidth) {
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
        if (direction == 'start') {
            toStart()
        }
        if (direction == 'end') {
            toEnd()
        }
        if (direction == 'right') {
            toRight()
        }
        if (direction == 'left') {
            toLeft()
        }
    }



    const { configureAddProductCategoryModal } = useCategoryState();
    const findElementInArray = (array, element) => {
        const result = array.find((category) => category === element)
        if (result) {
            return true
        }
    }
    return (
        <>
            <Container themeColor={themeColor}>
                <Button
                    onClick={() => MoveScroll('left')}
                    onDoubleClick={() => MoveScroll('start')}
                >
                    <MdKeyboardArrowLeft />
                </Button>

                <Categories
                    ref={categoriesRef}
                >
                    {
                        addCategoryBtn ? (
                            <Category
                                category={{ name: 'Categoría' }}
                                onClick={configureAddProductCategoryModal}
                                type='create'
                                icon={icons.operationModes.add}
                            />
                        ) : null
                    }

                    {
                        categories.length > 0 ? (
                            categories.map(({ category }, index) => (
                                <Category
                                    themeColor={themeColor ? themeColor : null}
                                    category={category}
                                    selected={findElementInArray(categorySelected, category.name)}
                                    key={category.name}
                                    index={index}
                                />
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
     background-color: ${props => props.theme.bg.shade}; 
    width: 100%;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    height: 2.6em;
    padding: 0 1em;
    gap: 0.4em;
    ${props => {
        switch (props.themeColor) {
            case 'transparent':
                return `
                    background-color: var(--color2);
                `

        }
    }}
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
    color: ${({ theme }) => theme.text.primary};
    background-color: transparent;
    border-radius: var(--border-radius-light);
    outline: 0;
    transition: 500ms background-color ease-in-out;
    :hover{
        background-color: rgba(0, 0, 0, 0.200);
    }
`
const Categories = styled(motion.ul)`
    border-radius: var(--border-radius-light);
    overflow-x: hidden;
    overflow-x: scroll;
     -webkit-overflow-scrolling: touch;
     scrollbar-width: none; 
     padding: 0;
    display: flex;
    flex-wrap: nowrap;
    gap: 0.6em;
    ::-webkit-scrollbar {
  display: none; /* Oculta la barra de scroll */
}
`

