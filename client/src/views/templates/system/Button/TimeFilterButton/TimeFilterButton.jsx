import React, { useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { BiCalendar } from 'react-icons/bi';
import styled from 'styled-components';
import { Button } from '../Button';
import { useClickOutSide } from '../../../../../hooks/useClickOutSide';

const TimeFilterButton = ({ onTimeFilterSelected }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const handleButtonClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    const [activeOption, setActiveOption] = useState(null);
    const handleMenuItemClick = (start, end, label) => {
        console.log(start, end);
        onTimeFilterSelected(start, end);
        setIsMenuOpen(false);
        setActiveOption(label);
    };

    const today = DateTime.local().startOf('day');
    const yesterday = DateTime.local().minus({ days: 1 }).startOf('day');
    const thisWeek = DateTime.local().startOf('week');
    const lastWeek = DateTime.local().minus({ weeks: 1 }).startOf('week');
    const thisMonth = DateTime.local().startOf('month');
    const lastMonth = DateTime.local().minus({ months: 1 }).startOf('month');
    const thisYear = DateTime.local().startOf('year');
    const lastYear = DateTime.local().minus({ years: 1 }).startOf('year');
    const currentYear = DateTime.local().year;
    const firstQuarterStart = DateTime.local(currentYear, 1, 1).startOf('day');
    const firstQuarterEnd = DateTime.local(currentYear, 3, DateTime.local(currentYear, 3, 1).daysInMonth).endOf('month').endOf('day');
    const secondQuarterStart = DateTime.local(currentYear, 4, 1).startOf('day');
    const secondQuarterEnd = DateTime.local(currentYear, 6, DateTime.local(currentYear, 6, 1).daysInMonth).endOf('month').endOf('day');
    const thirdQuarterStart = DateTime.local(currentYear, 7, 1).startOf('day');
    const thirdQuarterEnd = DateTime.local(currentYear, 9, DateTime.local(currentYear, 9, 1).daysInMonth).endOf('month').endOf('day');
    const fourthQuarterStart = DateTime.local(currentYear, 10, 1).startOf('day');
    const fourthQuarterEnd = DateTime.local(currentYear, 12, DateTime.local(currentYear, 12, 1).daysInMonth).endOf('month').endOf('day');

    const menuOptions = [
        { label: 'Hoy', start: today, end: DateTime.local().endOf('day'), category: 'General' },
        { label: 'Ayer', start: yesterday, end: today, category: 'General' },
        { label: 'Esta semana', start: thisWeek, end: DateTime.local().endOf('day'), category: 'Semana' },
        { label: 'La semana pasada', start: lastWeek, end: thisWeek, category: 'Semana' },
        { label: 'Este mes', start: thisMonth, end: DateTime.local().endOf('day'), category: 'Mes' },
        { label: 'El mes pasado', start: lastMonth, end: thisMonth, category: 'Mes' },
        { label: 'Este año', start: thisYear, end: DateTime.local().endOf('day'), category: 'Año' },
        { label: 'El año pasado', start: lastYear, end: thisYear, category: 'Año' },
        { label: 'Primer trimestre', start: firstQuarterStart, end: firstQuarterEnd, category: 'Trimestre' },
        { label: 'Segundo trimestre', start: secondQuarterStart, end: secondQuarterEnd, category: 'Trimestre' },
        { label: 'Tercer trimestre', start: thirdQuarterStart, end: thirdQuarterEnd, category: 'Trimestre' },
        { label: 'Cuarto trimestre', start: fourthQuarterStart, end: fourthQuarterEnd, category: 'Trimestre' },
    ]

    const groupedOptions = menuOptions.reduce((acc, option) => {
        const category = option.category || 'general';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(option);
        return acc;
    }, {});
    
    useClickOutSide(menuRef, isMenuOpen === true, () => setIsMenuOpen(false));
    const sections = Object.keys(groupedOptions);
    return (
        <div>
            <StyledButton onClick={handleButtonClick} >
                <Button
                    borderRadius='light'
                    startIcon={<BiCalendar />}
                    title={'filtrar Tiempo'}
                    onClick={handleButtonClick}
                />
                <StyledMenu isMenuOpen={isMenuOpen} ref={menuRef}>
                    {sections
                        .map((section) => (
                            <OptionsGroup>
                                <h3>{section}</h3>
                                {groupedOptions[section].map((option, index) => (
                                    <StyledMenuItem
                                        key={index}
                                        onClick={() =>
                                            handleMenuItemClick(option.start, option.end, option.label)
                                        }
                                    >
                                        {option.label}
                                    </StyledMenuItem>
                                ))}
                            </OptionsGroup>
                        ))}
                </StyledMenu>
            </StyledButton>
            {today == ! null && (
                <div>
                    <p>Desde: {today.toISODate()}</p>
                </div>
            )}
        </div>
    )
};

export default TimeFilterButton;

const StyledButton = styled.div``;

const StyledMenu = styled.ul`
  position: absolute;
  top: 7em;
  left: 50%;
  max-width: 600px;
  transform: translateX(-50%) scale(0);
 
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: var(--border-radius);
  padding: 0.5em;
  list-style: none;
  display: grid;
  gap: 0.5em;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));  
    grid-auto-flow: column;
    background-color: #575757;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  ${props => {
        switch (props.isMenuOpen) {
            case true:
                return `
                opacity: 1;  
                transform: translateX(-50%) scale(1);
            `
                break;

            default:
                break;
        }
    }}
`;

const StyledMenuItem = styled.li`
  list-style: none;
    border: 1px solid rgba(0, 0, 0, 0.200);
    display: flex;
    align-items: center;
    padding: 0 1em;
    height: 2.6em;
    margin: 0;
    font-weight: 450;
    font-size: 14px;
    border-radius: 6px;
    background-color: #777777;
    
    color: white;
    //box-shadow: inset 1px 2px 5px rgba(0, 0, 0, 0.152);
    text-transform: capitalize;
    
`;
const OptionsGroup = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 0.5em;
    h3 {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-light-yellow);
        text-transform: uppercase;
    }
    &:nth-child(1) {
        grid-column: 1 / 2;
        grid-row: 1 / 2;
    }
    :last-child{
        grid-column: 3 / 4;
        grid-row: 1 / 3;
    }
   
`;