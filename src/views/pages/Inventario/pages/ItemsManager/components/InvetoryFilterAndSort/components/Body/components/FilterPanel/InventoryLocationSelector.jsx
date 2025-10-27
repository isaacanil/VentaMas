import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createPopper } from '@popperjs/core';
import styled from 'styled-components';

const ChevronDown = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M4.47 6.47a.75.75 0 0 1 1.06 0L8 8.94l2.47-2.47a.75.75 0 0 1 1.06 1.06L8.53 10.47a.75.75 0 0 1-1.06 0L4.47 7.53a.75.75 0 0 1 0-1.06Z"
            fill="currentColor"
        />
    </svg>
);

export const InventoryLocationSelector = ({
    value = [],
    options = [],
    loading = false,
    placeholder = 'Todos los almacenes',
    onChange,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const popperInstanceRef = useRef(null);

    const sameWidthModifier = useMemo(
        () => ({
            name: 'sameWidth',
            enabled: true,
            phase: 'beforeWrite',
            requires: ['computeStyles'],
            fn({ state }) {
                state.styles.popper.width = `${state.rects.reference.width}px`;
            },
            effect({ state }) {
                state.elements.popper.style.width = `${state.elements.reference.offsetWidth}px`;
                return () => {};
            },
        }),
        []
    );

    const toggleOpen = useCallback(() => {
        if (loading) return;
        setOpen((prev) => !prev);
    }, [loading]);

    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event) => {
            const target = event.target;
            if (containerRef.current?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('pointerdown', handlePointerDown, { capture: true });
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            setSearch('');
            return;
        }
        if (!containerRef.current || !dropdownRef.current) return;

        const instance = createPopper(containerRef.current, dropdownRef.current, {
            placement: 'bottom-start',
            strategy: 'fixed',
            modifiers: [
                sameWidthModifier,
                {
                    name: 'offset',
                    options: { offset: [0, 10] },
                },
                {
                    name: 'preventOverflow',
                    options: { padding: 12 },
                },
                {
                    name: 'flip',
                    options: {
                        fallbackPlacements: ['top-start', 'right-start', 'left-start'],
                    },
                },
            ],
        });

        popperInstanceRef.current = instance;
        const raf = requestAnimationFrame(() => searchInputRef.current?.focus());

        return () => {
            cancelAnimationFrame(raf);
            instance.destroy();
            popperInstanceRef.current = null;
        };
    }, [open, sameWidthModifier]);

    useEffect(() => {
        if (!popperInstanceRef.current) return;
        popperInstanceRef.current.update();
    }, [open, search, value.length, options.length, loading]);

    const handleSearchChange = useCallback((event) => {
        setSearch(event.target.value);
    }, []);

    const optionMap = useMemo(() => {
        const map = new Map();
        options.forEach((option) => {
            if (!option?.id) return;
            map.set(option.id, option);
        });
        return map;
    }, [options]);

    const selectedOptions = useMemo(
        () => value.map((id) => optionMap.get(id)).filter(Boolean),
        [optionMap, value]
    );

    const normalizedSearch = search.trim().toLowerCase();
    const filteredOptions = useMemo(() => {
        if (!normalizedSearch) return options;
        return options.filter((option) => {
            const fallback = `${option?.title ?? ''} ${option?.subtitle ?? ''}`.trim();
            const haystack = (option?.searchText || fallback).toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }, [normalizedSearch, options]);

    const allSelected = useMemo(() => {
        if (!options.length) return false;
        return options.every((option) => value.includes(option.id));
    }, [options, value]);

    const handleToggleOption = useCallback(
        (optionId) => {
            if (!optionId) return;
            const exists = value.includes(optionId);
            const nextValue = exists ? value.filter((id) => id !== optionId) : [...value, optionId];
            onChange?.(nextValue);
        },
        [onChange, value]
    );

    const handleSelectAll = useCallback(() => {
        if (!options.length) return;
        if (allSelected) {
            onChange?.([]);
            return;
        }
        onChange?.(options.map((option) => option.id));
    }, [allSelected, onChange, options]);

    const handleClear = useCallback(() => {
        if (!value.length) return;
        onChange?.([]);
    }, [onChange, value.length]);

    const chips = useMemo(() => {
        const MAX_VISIBLE = 3;
        if (!selectedOptions.length) return { visible: [], extra: 0 };
        const visible = selectedOptions.slice(0, MAX_VISIBLE);
        const extra = selectedOptions.length > MAX_VISIBLE ? selectedOptions.length - MAX_VISIBLE : 0;
        return { visible, extra };
    }, [selectedOptions]);

    const hasSelections = selectedOptions.length > 0;
    const isButtonActive = open || hasSelections;
    const isEmptyState = !loading && !options.length;

    return (
        <Wrapper ref={containerRef}>
            <SelectorButton
                type="button"
                onClick={toggleOpen}
                disabled={loading}
                aria-haspopup="listbox"
                aria-expanded={open}
                $active={isButtonActive}
            >
                <SelectorContent>
                    {loading ? (
                        <Placeholder>Actualizando ubicaciones...</Placeholder>
                    ) : !hasSelections ? (
                        <Placeholder>{placeholder}</Placeholder>
                    ) : (
                        <Chips>
                            {chips.visible.map((option) => (
                                <Chip key={option.id} title={option.subtitle || option.title}>
                                    {option.title}
                                </Chip>
                            ))}
                            {chips.extra > 0 && <Chip>{`+${chips.extra}`}</Chip>}
                        </Chips>
                    )}
                </SelectorContent>
                <Chevron $open={open}>
                    <ChevronDown />
                </Chevron>
            </SelectorButton>
            {open && createPortal(
                <Dropdown
                    ref={dropdownRef}
                    role="listbox"
                    data-inventory-selector-overlay="true"
                >
                    <SearchBar>
                        <SearchInput
                            ref={searchInputRef}
                            type="search"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar ubicacion..."
                            aria-label="Buscar ubicacion de inventario"
                        />
                    </SearchBar>
                    <OptionsList>
                        {loading ? (
                            <StateMessage>Calculando agregados de inventario...</StateMessage>
                        ) : isEmptyState ? (
                            <StateMessage>No hay almacenes disponibles.</StateMessage>
                        ) : filteredOptions.length === 0 ? (
                            <StateMessage>Sin resultados para la busqueda.</StateMessage>
                        ) : (
                            filteredOptions.map((option) => {
                                const checked = value.includes(option.id);
                                const inputId = `inventory-location-${option.id}`;
                                return (
                                    <OptionItem key={option.id} $checked={checked} htmlFor={inputId}>
                                        <Checkbox
                                            id={inputId}
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleToggleOption(option.id)}
                                        />
                                        <OptionText>
                                            <OptionTitle>{option.title}</OptionTitle>
                                            {option.subtitle && <OptionSubtitle>{option.subtitle}</OptionSubtitle>}
                                        </OptionText>
                                    </OptionItem>
                                );
                            })
                        )}
                    </OptionsList>
                    <Footer>
                        <FooterButton
                            type="button"
                            onClick={handleSelectAll}
                            disabled={loading || isEmptyState}
                        >
                            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </FooterButton>
                        <FooterButton type="button" onClick={handleClear} disabled={!hasSelections || loading}>
                            Limpiar
                        </FooterButton>
                    </Footer>
                </Dropdown>,
                document.body
            )}
        </Wrapper>
    );
};

const Wrapper = styled.div`
    position: relative;
    width: 100%;
`;

const SelectorButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    min-height: 2.4rem;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    border: 1px solid ${({ $active }) => ($active ? '#228df1ff' : '#d7dce3')};
    background: ${({ disabled }) => (disabled ? '#f3f4f6' : '#ffffff')};
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
    transition: border 0.18s ease, box-shadow 0.18s ease;
    box-shadow: ${({ $active }) => ($active ? '0 0 0 3px rgba(30, 64, 175, 0.1)' : 'none')};

    &:hover {
        border-color: ${({ disabled }) => (disabled ? '#d7dce3' : '#1e40af')};
    }

    &:focus-visible {
        outline: none;
        border-color: #1e40af;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.18);
    }
`;

const SelectorContent = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
`;

const Placeholder = styled.span`
    color: #94a3b8;
    font-size: 0.82rem;
`;

const Chips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
`;

const Chip = styled.span`
    display: inline-flex;
    align-items: center;
    max-width: 180px;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(30, 64, 175, 0.11);
    color: #1e40af;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Chevron = styled.span`
    display: inline-flex;
    transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
    transition: transform 0.18s ease;
    color: #475569;
`;

const Dropdown = styled.div`
    z-index: 1200;
    display: grid;
    gap: 0;
    border-radius: 14px;
    border: 1px solid #d7dce3;
    background: #ffffff;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.15);
    overflow: hidden;
`;

const SearchBar = styled.div`
    padding: 0.65rem 0.75rem 0.4rem;
    border-bottom: 1px solid #eef1f6;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    border: 1px solid #d7dce3;
    font-size: 0.85rem;
    color: #0f172a;
    background: #f9fafb;

    &:focus {
        outline: none;
        border-color: #1e40af;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
        background: #ffffff;
    }

    &::placeholder {
        color: #9ca3af;
    }
`;

const OptionsList = styled.div`
    max-height: 260px;
    overflow-y: auto;
    padding: 0.4rem 0.25rem 0.4rem 0.25rem;
    display: grid;
    gap: 0.1rem;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.6);
        border-radius: 999px;
    }
`;

const OptionItem = styled.label`
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.55rem 0.65rem;
    margin: 0 0.35rem;
    border-radius: 12px;
    cursor: pointer;
    background: ${({ $checked }) => ($checked ? 'rgba(30, 64, 175, 0.08)' : 'transparent')};
    transition: background 0.18s ease;

    &:hover {
        background: ${({ $checked }) => ($checked ? 'rgba(30, 64, 175, 0.12)' : '#f3f6ff')};
    }
`;

const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    margin-top: 0.2rem;
`;

const OptionText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
`;

const OptionTitle = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const OptionSubtitle = styled.span`
    font-size: 0.72rem;
    color: #475569;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const StateMessage = styled.div`
    padding: 1.1rem 1rem;
    text-align: center;
    font-size: 0.78rem;
    color: #64748b;
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem 0.75rem;
    border-top: 1px solid #eef1f6;
    background: #f9fafc;
`;

const FooterButton = styled.button`
    border: none;
    background: none;
    color: #1e40af;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.25rem 0.45rem;
    border-radius: 8px;

    &:hover:enabled {
        background: rgba(30, 64, 175, 0.08);
    }

    &:disabled {
        color: #9ca3af;
        cursor: not-allowed;
    }
`;
