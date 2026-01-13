import { Button } from 'antd';
import { motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, useMemo, type RefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import {
  resetFilters,
  DEFAULT_FILTER_CONTEXT,
  DEFAULT_FILTERS,
  loadFilterPreferences,
  persistFilterPreferences,
  selectFiltersByContext,
  selectFilterMeta,
} from '@/features/filterProduct/filterProductsSlice';
import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';

import { Body } from './components/Body/Body';
import { Header } from './components/Header/Header';
import type { InventoryFilterAndSortProps } from '@/types/ui';

type FilterState = Record<string, unknown>;
type FilterMeta = ReturnType<typeof selectFilterMeta>;
type FilterField = keyof typeof DEFAULT_FILTERS;

type UserLike = {
  uid?: string;
  id?: string;
  userId?: string;
  user_id?: string;
} | null;

const normalizeArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

const isSameFilterValue = (
  field: FilterField,
  current: unknown,
  comparison: unknown,
) => {
  const defaultValue = DEFAULT_FILTERS[field];
  if (Array.isArray(defaultValue)) {
    const currentArr = normalizeArray(current);
    const compareArr = normalizeArray(comparison);
    if (currentArr.length !== compareArr.length) return false;
    return currentArr.every((item, index) => item === compareArr[index]);
  }
  return current === comparison;
};

// Easing curves inspiradas en Material & Human Interface Guidelines
// (valores cubic-bezier para desacelerar suave y acelerar sutil)
const EASE_OUT_SOFT = [0.05, 0.7, 0.1, 1]; // enfatiza la desaceleración
const EASE_IN_OUT = [0.4, 0.0, 0.2, 1]; // estándar fluida

const useOutsideClickIgnoreAntD = (
  ref: RefObject<HTMLElement>,
  active: boolean,
  onOutside?: () => void,
) => {
  useEffect(() => {
    if (!active) return;

    const isInAntDOverlay = (el: Element | null) =>
      !!el?.closest?.(
        '.ant-select-dropdown, .ant-picker-dropdown, .ant-cascader-dropdown, .ant-dropdown, .ant-tooltip, .ant-popover, [data-inventory-selector-overlay="true"]',
      );

    const handler = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!ref.current) return;
      // Si el click está dentro del panel, no cerrar
      if (ref.current.contains(target)) return;
      // Ignorar overlays/popups de AntD (select, picker, cascader, dropdown, tooltip, popover)
      if (isInAntDOverlay(target)) return;
      onOutside?.();
    };

    // pointerdown + capture mejora la fiabilidad con portales/overlays
    document.addEventListener('pointerdown', handler, { capture: true });
    return () =>
      document.removeEventListener('pointerdown', handler, { capture: true });
  }, [active, onOutside, ref]);
};

export const InventoryFilterAndSort = ({
  tooltip,
  tooltipDescription,
  tooltipPlacement,
  contextKey = DEFAULT_FILTER_CONTEXT,
}: InventoryFilterAndSortProps) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const user = useSelector(selectUser) as UserLike;
  const filters = useSelector((state) =>
    selectFiltersByContext(state, contextKey),
  ) as FilterState;
  const meta = useSelector(selectFilterMeta) as FilterMeta;
  const userId = useMemo(() => {
    if (!user) return null;
    return user.uid || user.id || user.userId || user.user_id || null;
  }, [user]);
  const isContextHydrated = Boolean(meta?.hydratedContexts?.[contextKey]);
  const isContextDirty = Boolean(meta?.dirtyContexts?.[contextKey]);

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
    if (meta?.saving) return;
    if (meta?.loadedForUser !== userId) return;
    if (!isContextHydrated) return;
    if (!isContextDirty) return;

    dispatch(persistFilterPreferences({ userId, context: contextKey }));
  }, [
    dispatch,
    userId,
    isContextHydrated,
    isContextDirty,
    meta?.loading,
    meta?.saving,
    meta?.loadedForUser,
    contextKey,
  ]);

  const activeFiltersCount = useMemo(() => {
    if (!filters) return 0;
    return Object.keys(DEFAULT_FILTERS).reduce((count, field) => {
      const typedField = field as FilterField;
      return (
        count +
        (!isSameFilterValue(
          typedField,
          filters?.[typedField],
          DEFAULT_FILTERS[typedField],
        )
          ? 1
          : 0)
      );
    }, 0);
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Variants dependientes de reduced motion (evita animaciones complejas si el usuario lo solicita)
  const menuVariant = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      }
    : {
        hidden: {
          x: -18,
          opacity: 0,
          scale: 0.985,
          filter: 'blur(6px)',
          transition: { duration: 0.18, ease: EASE_IN_OUT },
        },
        visible: {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transition: {
            duration: 0.26,
            ease: EASE_OUT_SOFT,
          },
        },
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
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
        exit="hidden"
        // Evita interacción mientras está oculto
        style={{ pointerEvents: `${isOpen ? 'auto' : 'none'}` }}
      >
        <Header onClose={handleOpen} />
        <Body contextKey={contextKey} />
        <Footer>
          <Actions>
            <Button onClick={handleReset}>Restablecer</Button>
            <Button type="primary" onClick={handleOpen}>
              Aplicar
            </Button>
          </Actions>
        </Footer>
      </FloatingMenu>
    </Container>
  );
};
const Container = styled.div`
  /* This is a container for the filter button and the floating menu. */
`;
const FloatingMenu = styled(motion.aside)`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  width: min(410px, 92vw);
  max-height: calc(100vh - 24px);
  overflow: hidden;
  outline: none;
  background: #fff;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 12px;
  box-shadow: 0 4px 28px rgb(0 0 0 / 18%);
  backdrop-filter: blur(3px);
  transform-origin: top left;
  will-change: transform, opacity;

  @media (width <= 640px) {
    top: 2px;
    right: 2px;
    left: 2px;
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    filter: none !important;
    transition: none !important;
    animation: none !important;
  }
`;

const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6em;
  align-items: flex-start;
  padding: 0.65em 0.9em 0.8em;
  background: linear-gradient(#fff, #fafafa);
  border-top: 1px solid #f0f0f0;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: end;
  width: 100%;
`;
