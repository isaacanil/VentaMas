import React, { useState } from 'react'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'
import { DeleteButton } from '../../../templates/system/Button/DeleteButton'
import { EditButton } from '../../../templates/system/Button/EditButton'
import { PlusIconButton } from '../../../templates/system/Button/PlusIconButton'
import { InputText, InputNumber } from '../../../templates/system/Inputs/Input'
import { separator } from '../../../../hooks/separator'
import { v4 } from 'uuid'
import { addIngredientTypePizza, getCustomProduct } from '../../../../firebase/firebaseconfig.jsx'
import { useEffect } from 'react'
import { isEmpty } from '@firebase/util'
import { nanoid } from 'nanoid'
import { IngredientCard } from '../../../templates/system/Product/typePizza/IngredientCard'
import { IoIosArrowBack, IoMdClose } from 'react-icons/io'
export const AddCustomProductModal = ({isOpen, handleOpen}) => {
    
    const [product, setProduct] = useState([])
    useEffect(() => {
        getCustomProduct(setProduct)
    }, [])
    console.log(product)
    const [ingredient, setIngredient] = useState({
        name: '',
        cost: 0,
        id: ''
    })
    console.log(ingredient)
    const settingIngredientId = () => {
        return new Promise((resolve, reject) => {
            resolve(
                setIngredient({
                    ...ingredient,
                    id: v4()
                })
            )
            
        })
    }
    console.log(ingredient)

    const handleOnChange = () => {
        settingIngredientId().then(() => {
            if(ingredient.cost && ingredient.id && ingredient.name !== ''){
                addIngredientTypePizza(ingredient)
                console.log('done')
                setIngredient({
                    name: '',
                    cost: '',
                    id: ''
                })
            }
        })


    }
    return (
        isOpen ? (
            <Modal>
            <Head>
                <Container>
                    <Button 
                    bgcolor='error' 
                    startIcon={<IoIosArrowBack />} 
                    title='atrás'
                    onClick={handleOpen}
                    ></Button>
                </Container>
            </Head>
            <Body>
                <TitleSection>
                    <h4>Características del Producto</h4>
                </TitleSection>

                {/* <Flex
                    alignItems='center'
                >
                    <Col>
                        <select name="" id="">
                            <option value="">Elige un producto</option>
                            <option value="">Pizza</option>
                        </select>
                    </Col>
                    <Col>
                        <PlusIconButton></PlusIconButton>
                    </Col>

                </Flex> */}
                <Flex
                    alignItems='center'
                    justifyContent='space-between'
                >
                    <Group>
                        <Col>
                            <InputText
                                value={ingredient.name}
                                placeholder='Agregar Ingrediente'
                                onChange={(e) => setIngredient({ ...ingredient, name: e.target.value })} />
                        </Col>
                        <Col>
                            <InputNumber
                                value={ingredient.cost}
                                size='small'
                                placeholder='Precio'
                                onChange={(e) => setIngredient(
                                    { ...ingredient, cost: e.target.value }
                                )} />
                        </Col>
                    </Group>
                    <Col justifySelf='right'>
                        <PlusIconButton fn={handleOnChange}></PlusIconButton>
                    </Col>

                </Flex>
                <Box>
                    <List>
                        {
                            !isEmpty(product) ? (
                                product.ingredientList.length > 0 ? (
                                    product.ingredientList.map((item, index) => (
                                        <IngredientCard key={index} item={item} ></IngredientCard>

                                    ))
                                ) : null
                            ) : null
                        }

                    </List>
                </Box>
            </Body>
        </Modal>
        ) : null
          
     
    )
}
const Backdrop = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    
    `
const Modal = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    max-height: 600px;
    width: 100%;
    background-color: rgb(221,220,220);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.100);
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
`
const Head = styled.div`
    height: 2.5em;
    width: 100%;
    background-color: rgb(60, 60, 60);
    color: white;
    display: flex;
    align-items: center;
    padding: 0 0.4em 0 1em;
    justify-content: space-between;
`
const Body = styled.div`
    display: grid;
    grid-template-rows: min-content min-content 1fr;

`
const TitleSection = styled.div`
    padding: 1em ;
`
const Container = styled.div`
    
`
const Box = styled.div`
    height: 100%;
    width: 100%;
    padding: 0.6em;
`
const List = styled.ul`
    border: 1px solid rgba(0, 0, 0, 0.161);
    border-radius: 10px;
    height: 100%;
    width: 100%;
    background-color: #bbbbbb;
    padding: 0.4em;
    overflow: hidden;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.137);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: min-content;
    gap: 0.2em;
    
`
const Item = styled.div`
    height: 2.5em;
    background-color: #f0f0f0;
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.300);
    border-radius: 8px;
    display: grid;
   
    align-items: center;
    padding: 0 1em;
    grid-template-columns: 1fr 1fr min-content min-content;
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;


`
const Row = styled.div``
const Col = styled.div`
    justify-self: ${props => props.justifySelf ? 'flex-end' : 'none'};
`
const Flex = styled.div`
    display: flex;
    width: 100%;
    justify-content: ${props => props.justifyContent ? props.justifyContent : 'none'};
    padding: ${props => props.padding ? props.padding : " 0 1em"};
    gap: ${props => props.gap ? props.gap : "1em"};
    align-items: ${props => props.alignItems};
    background-color: ${props => props.backgroundColor};

`