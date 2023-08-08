import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../templates/system/Button/Button'
import { icons } from '../../../../../../../constants/icons/icons'
import { SubTitle } from '../../../../../checkout/Receipt'
import { opcionesCriterio, opcionesOrden, } from './InventoryFilterAndSortMetadata'
import { Header } from './components/Header/Header'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { Body } from './components/Body/Body'

export const InventoryFilterAndSort = () => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => { setIsOpen(!isOpen) };

    const MenuVariant = {
        hidden: {
            x: '110%'
        },
        visible: {
            x: 0,
            transition: {
                type: 'spring',
                stiffness: 120,
                mass: 0.4,
                damping: 8,
                when: 'beforeChildren',
                staggerChildren: 0.4
            }
        }
    }

    return (
        <Container>
            <Button
                type='primary'
                size='small'
                width={'icon32'}
                startIcon={icons.operationModes.filter}
                borderRadius={'light'}
                onClick={handleOpen}
            />
            <MenuFlotante
                variants={MenuVariant}
                initial='hidden'
                animate={isOpen ? 'visible' : 'hidden'}
                exit='hidden'
            >
                <Header onClose={handleOpen} />
                <Body />
            </MenuFlotante>
        </Container>
    )
}
const Container = styled.div``
const MenuFlotante = styled(motion.div)`
  position: fixed;
  top: 10px;
  z-index: 100;
  max-width: 400px;
  width: 100%;
  height: 100%;
  max-height: 90vh;
  right: 10px;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.20);
  display: grid;
  align-content: start;
  gap:1em;
  overflow-y: auto;
`;










