import { Button } from 'antd';
import { motion, useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { icons } from '../../../../../../../constants/icons/icons'
import { resetFilters, DEFAULT_FILTER_CONTEXT, DEFAULT_FILTERS, loadFilterPreferences, persistFilterPreferences, selectFiltersByContext, selectFilterMeta } from '../../../../../../../features/filterProduct/filterProductsSlice'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { ButtonIconMenu } from '../../../../../../templates/system/Button/ButtonIconMenu'

import { Body } from './components/Body/Body'
import { Header } from './components/Header/Header'

const normalizeArray = (value = []) =>
    Array.isArray(value) ? [...value].sort() : [];

const isSameFilterValue = (field, current, comparison) => {
    const defaultValue = DEFAULT_FILTERS[field];
    if (Array.isArray(defaultValue)) {
        const currentArr = normalizeArray(current);
        const compareArr = normalizeArray(comparison);
        if (currentArr.length !== compareArr.length) return false;
        return currentArr.every((item, index) => item === compareArr[index]);
    }
    return current === comparison;
};

const haveFiltersChanged = (prev = {}, next = {}) =>
    Object.keys(DEFAULT_FILTERS).some((field) => !isSameFilterValue(field, prev[field], next[field]));

const cloneFilters = (filters) => {
    if (!filters) return filters;
    try {
        return JSON.parse(JSON.stringify(filters));
    } catch (error) {
        return { ...filters };
    }
};

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
                    '.ant-select-dropdown, .ant-picker-dropdown, .ant-cascader-dropdown, .ant-dropdown, .ant-tooltip, .ant-popover, [data-inventory-selector-overlay=\"true\"]'
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

export const InventoryFilterAndSort = ({
    tooltip,
    tooltipDescription,
    tooltipPlacement,
    contextKey = DEFAULT_FILTER_CONTEXT,
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const user = useSelector(selectUser);
    const filters = useSelector((state) => selectFiltersByContext(state, contextKey));
    const meta = useSelector(selectFilterMeta);
    const userId = useMemo(() => {
        if (!user) return null;
        return user.uid || user.id || user.userId || user.user_id || null;
    }, [user]);
    const previousFiltersRef = useRef(cloneFilters(filters));

    const handleOpen = useCallback(() => setIsOpen((v) => !v), []);
    const close = useCallback(() => setIsOpen(false), []);

    useOutsideClickIgnoreAntD(menuRef, isOpen, close);

    const handleReset = () => dispatch(resetFilters({ context: contextKey }));

    useEffect(() => {
        if (isOpen && menuRef.current) {
            menuRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!userId) return;
        if (meta?.loading) return;
        if (meta?.loadedForUser === userId) return;
        dispatch(loadFilterPreferences({ userId }));
    }, [dispatch, userId, meta?.loadedForUser, meta?.loading]);

    useEffect(() => {
        if (!userId) return;
        if (meta?.loading) return;
        if (meta?.loadedForUser !== userId) return;
        if (!meta?.hydratedContexts?.[contextKey]) return;
        previousFiltersRef.current = cloneFilters(filters);
    }, [userId, meta?.loadedForUser, meta?.hydratedContexts?.[contextKey], filters, meta?.loading, contextKey]);

    useEffect(() => {
        if (!userId) return;
        if (meta?.loading) return;
        if (meta?.loadedForUser !== userId) return;
        if (!meta?.hydratedContexts?.[contextKey]) return;

        const prevValues = previousFiltersRef.current;
        const hasChanged = haveFiltersChanged(prevValues, filters);
        if (!hasChanged) return;
        previousFiltersRef.current = cloneFilters(filters);
        dispatch(persistFilterPreferences({ userId, context: contextKey }));
    }, [dispatch, userId, filters, meta?.loading, meta?.hydratedContexts?.[contextKey], meta?.loadedForUser, contextKey]);

    const activeFiltersCount = useMemo(() => {
        if (!filters) return 0;
        return Object.keys(DEFAULT_FILTERS).reduce((count, field) => (
            count + (!isSameFilterValue(field, filters[field], DEFAULT_FILTERS[field]) ? 1 : 0)
        ), 0);
    }, [filters]);

    const hasActiveFilters = activeFiltersCount > 0;

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
                indicator={hasActiveFilters}
                indicatorCount={activeFiltersCount}
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
                <Body contextKey={contextKey} />
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
top: 2px; 
right: 2px; 
left: 2px; 
width: 100%; 
height: 100vh; 
max-height: 100vh;  
box-shadow: none; 
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


