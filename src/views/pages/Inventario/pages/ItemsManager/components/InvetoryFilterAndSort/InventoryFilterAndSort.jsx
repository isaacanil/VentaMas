import { useRef, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { motion, useReducedMotion } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from 'antd';

import { icons } from '../../../../../../../constants/icons/icons'
import { Header } from './components/Header/Header'
import { Body } from './components/Body/Body'
import { ButtonIconMenu } from '../../../../../../templates/system/Button/ButtonIconMenu'
import { resetFilters, selectCriterio, selectInventariable, selectItbis, selectOrden } from '../../../../../../../features/filterProduct/filterProductsSlice'

// Easing curves inspiradas en Material & Human Interface Guidelines
// (valores cubic-bezier para desacelerar suave y acelerar sutil)
const EASE_OUT_SOFT = [0.05, 0.7, 0.1, 1];     // enfatiza la desaceleración
const EASE_IN_OUT = [0.4, 0.0, 0.2, 1];        // estándar fluida

const useOutsideClickIgnoreAntD = (ref, active, onOutside) => {
    useEffect(() => {
        if (!active) return;


        const isInAntDOverlay = (el) =>
            !!(
                el?.closest?.(
                    '.ant-select-dropdown, .ant-picker-dropdown, .ant-cascader-dropdown, .ant-dropdown, .ant-tooltip, .ant-popover'
                )
            );


        const handler = (e) => {
            const target = e.target;
            if (!ref.current) return;
            // Si el click está dentro del panel, no cerrar
            if (ref.current.contains(target)) return;
            // Ignorar overlays/popups de AntD (select, picker, cascader, dropdown, tooltip, popover)
            if (isInAntDOverlay(target)) return;
            onOutside?.();
        };


        // pointerdown + capture mejora la fiabilidad con portales/overlays
        document.addEventListener('pointerdown', handler, { capture: true });
        return () => document.removeEventListener('pointerdown', handler, { capture: true });
    }, [active, onOutside, ref]);
};

export const InventoryFilterAndSort = ({tooltip, tooltipDescription, tooltipPlacement}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const reduceMotion = useReducedMotion();

    const handleOpen = useCallback(() => setIsOpen((v) => !v), []);
    const close = useCallback(() => setIsOpen(false), []);

    useOutsideClickIgnoreAntD(menuRef, isOpen, close);

    const handleReset = () => dispatch(resetFilters());

    useEffect(() => {
        if (isOpen && menuRef.current) {
            menuRef.current.focus();
        }
    }, [isOpen]);

    // Variants dependientes de reduced motion (evita animaciones complejas si el usuario lo solicita)
    const menuVariant = reduceMotion ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } }
    } : {
        hidden: {
            x: -18,
            opacity: 0,
            scale: 0.985,
            filter: 'blur(6px)',
            transition: { duration: 0.18, ease: EASE_IN_OUT }
        },
        visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 0.26,
                ease: EASE_OUT_SOFT
            }
        }
    };

    return (
        <Container>
            <ButtonIconMenu
                icon={icons.operationModes.filter}
                onClick={handleOpen}
                tooltip={tooltip}
                tooltipDescription={tooltipDescription}
                tooltipPlacement={tooltipPlacement}
            />
            <FloatingMenu
                role="dialog"
                aria-modal="true"
                aria-hidden={!isOpen}
                variants={menuVariant}
                ref={menuRef}
                initial='hidden'
                animate={isOpen ? 'visible' : 'hidden'}
                exit='hidden'
                // Evita interacción mientras está oculto
                style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
            >
                <Header onClose={handleOpen} />
                <Body />
                <Footer>
                    <Actions>
                        <Button onClick={handleReset} >Restablecer</Button>
                        <Button type="primary" onClick={handleOpen}>Aplicar</Button>
                    </Actions>
                </Footer>
            </FloatingMenu>
        </Container>
    )
}
const Container = styled.div``
const FloatingMenu = styled(motion.aside)`
position: fixed;
top: 12px;
left: 12px;
z-index: 200;
width: min(410px, 92vw);
max-height: calc(100vh - 24px);
background: #fff;
border: 1px solid var(--border-color, #e5e5e5);
border-radius: 12px;
box-shadow: 0 4px 28px rgba(0,0,0,.18);
display: grid;
grid-template-rows: min-content 1fr min-content;
overflow: hidden;
backdrop-filter: blur(3px);
outline: none;
 transform-origin: top left;
 will-change: transform, opacity;


@media (max-width: 640px){
top: 0; right: 0; width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; box-shadow: none; border: none;
}

 @media (prefers-reduced-motion: reduce){
    transition: none !important;
    animation: none !important;
    filter: none !important;
 }
`;

const Footer = styled.footer`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: .6em;
    padding: .65em .9em .8em;
    border-top: 1px solid #f0f0f0;
    background: linear-gradient(#fff, #fafafa);
`;

const Actions = styled.div`
    display: flex;
    width: 100%;
    gap: .5em;
    align-items: center;
    justify-content: end;
`;










