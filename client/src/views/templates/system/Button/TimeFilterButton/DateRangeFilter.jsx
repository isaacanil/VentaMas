import React, { useMemo, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { BiCalendar } from 'react-icons/bi';
import styled from 'styled-components';
import { Button } from 'antd';
import { useClickOutSide } from '../../../../../hooks/useClickOutSide';
import { usePopper } from 'react-popper';
import Typography from '../../Typografy/Typografy';
import { truncateString } from '../../../../../utils/text/truncateString';
import { useMenuOptions } from './useMenuOptions';
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth';

const menuVariant = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        transition: {
            duration: 0.1,
        },
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.1,
        },
    },
};

export const DateRangeFilter = ({ setDates, dates }) => {
    // Popper
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        modifiers: [{ name: 'arrow' }],
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const handleButtonClick = () => setIsMenuOpen(!isMenuOpen);

    const handleMenuItemClick = (startDate, endDate, label) => {
        setDates({ startDate, endDate });

    };

    const { menuOptions } = useMenuOptions();

    const getActiveOptionByDates = () => {
        const { startDate, endDate } = dates;
        const foundOption = menuOptions.find(option => option.startDate === startDate && option.endDate === endDate);
        return foundOption && `${foundOption.label || "Personalizado"}`;
    }

    const activeOptionLabel = useMemo(() => getActiveOptionByDates(), [dates, menuOptions]);

    const groupedOptions = menuOptions.reduce((acc, option) => {
        const category = option.category || 'general';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(option);
        return acc;
    }, {});

    useClickOutSide(menuRef, isMenuOpen, () => setIsMenuOpen(false));
    const sections = Object.keys(groupedOptions);
    const dateForHuman = (date) => {
        if (!date) return;
        if (typeof date !== 'number') return;
        return DateTime.fromMillis(date).toLocaleString(DateTime.DATE_MED)
    }
    const vw = useViewportWidth();
    const truncateOptions = (string = [], length = 4) => {
        if (vw < 800) {
            return truncateString(string, length)
        }
        if(string.length > 400) return truncateString(string, 4)
        return string
    }
    return (
        <StyledButton ref={menuRef} >
            <Button
                ref={setReferenceElement}
             
               icon={<BiCalendar />}
                title={truncateOptions(activeOptionLabel, 4) || 'Filtrar Fechas'}
                onClick={handleButtonClick}
            >
            {truncateOptions(activeOptionLabel, 4) || 'Filtrar Fechas'}
            </Button>
            {
                isMenuOpen &&
                <StyledMenu
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                >
                    <Header>
                        <Typography variant='h4' disableMargins>
                            Rango Seleccionado
                        </Typography>
                        <Typography disableMargins>
                            {activeOptionLabel || `${dateForHuman(dates.startDate)} - ${dateForHuman(dates.endDate)}`} {/* Puedes usar un mensaje por defecto como "Seleccione un rango" */}
                        </Typography>

                    </Header>
                    <Body>

                        <Options>
                            {sections
                                .map((section) => (
                                    <OptionsGroup>
                                        <h3>{section}</h3>
                                        <Items>

                                            {groupedOptions[section].map((option, index) => (
                                                <StyledMenuItem
                                                    key={index}
                                                    isActive={activeOptionLabel === option.label}
                                                    onClick={() =>
                                                        handleMenuItemClick(option.startDate, option.endDate, option.label)
                                                    }
                                                >
                                                    {option.label}
                                                </StyledMenuItem>
                                            ))}
                                        </Items>
                                    </OptionsGroup>
                                ))}
                        </Options>
                    </Body>

                </StyledMenu>
            }
            <div ref={setArrowElement} style={styles.arrow} />
        </StyledButton>
    )
};



const Header = styled.div`
    background-color: white;
    padding: 0.5em 1em ;
    position: sticky;
    top: 0;
`

const Body = styled.div`
padding: 1em;
`

const Options = styled.div`
    display: grid;
    gap: 2em 1em;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
`

const StyledButton = styled.div`
    
`;

const StyledMenu = styled.ul`
/*box */
    max-width: 800px;
    width: 100%;
    height: calc(100vh - 12em);
    align-content: start;
    overflow-y: scroll;
    background-color: #F1F1F1;
    border: 1px solid #ccc;
    border-radius: var(--border-radius);
    padding: 0;
    list-style: none;
 
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.212);
    z-index: 100000;
    transition: opacity 0.2s ease-in-out;
 
`;

const StyledMenuItem = styled.li`
    list-style: none;
    display: flex;
    align-items: center;
    padding: 0 1em;
    height: 2.6em;
    margin: 0;
    font-weight: 450;
    font-size: 14px;
    border-radius: 6px;
    background-color: ${props => props.isActive ? '#2772e4' : '#ffffff'}; 
    color: ${props => props.isActive ? '#ffffff' : '#000000'};
    text-transform: capitalize;
    
`;
const OptionsGroup = styled.div`
    display: grid;
    align-content: start;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    text-align: left;
    gap: 0.5em;
    h3 {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
    } 
`;

const Items = styled.div`
    display: grid;
    gap: 0.5em;
    text-align: left;
    padding: 0;
    margin: 0;
    @media (max-width: 800px) {
        grid-template-columns: 1fr ;
    }
`;