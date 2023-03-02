import React, { useRef } from 'react'
import { IoIosArrowBack } from 'react-icons/io'
import styled from 'styled-components'
import { Button } from '../../../../../templates/system/Button/Button'
import { CgMathPlus } from 'react-icons/cg'
import { Tooltip } from '../../../../../templates/system/Button/Tooltip'
export const Toolbar = ({ data, handleOpen, elementRef}) => {

    return (
        <Container>
            <Col onClick={handleOpen}>
                <Button startIcon={<IoIosArrowBack />} variant='contained' color='primary' title={'atrás'}></Button>
            </Col>
            <Col position='center'>
                {data.name}
            </Col>
            <Col position='end'>
                {
                  
                        // <Tooltip 
                        // description={`Crear ${data.name}`} 
                        // placement='bottom-end'
                        // Children={<Button
                        //     title={<CgMathPlus />}
                        //     borderRadius='normal'
                        //     width='icon32'
                        //     elementRef={elementRef}
                        //     description={'hola'}
                        //     color='primary'
                        // />}
                        // />

                 
                }


            </Col>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: repeat(3, 1fr);
    
`
const Col = styled.div`
display: flex;
align-items: center;
    ${(props) => {
        switch (props.position) {
            case 'center':
                return `
                justify-content: center;
                font-weight: 500;
                color: var(--Gray8)
                `
            case 'end':
                return `
                justify-content: end;
                font-weight: 500;
                color: var(--Gray8)
                `


            default:
                break;
        }
    }}
`