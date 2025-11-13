import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { DateTime } from 'luxon';
import React, { useMemo, useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { useClickOutSide } from '../../../../../hooks/useClickOutSide';
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth';
import { truncateString } from '../../../../../utils/text/truncateString';
import Typography from '../../Typografy/Typografy';

import { useMenuOptions } from './useMenuOptions';

export const DateRangeFilter = ({ setDates, dates }) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [_arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: 'arrow' }],
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const handleButtonClick = () => setIsMenuOpen(!isMenuOpen);

  const handleMenuItemClick = (startDate, endDate) => {
    setDates({ startDate, endDate });
  };

  const { menuOptions } = useMenuOptions();

  const getActiveOptionByDates = () => {
    const { startDate, endDate } = dates;
    const foundOption = menuOptions.find(
      (option) => option.startDate === startDate && option.endDate === endDate,
    );
    return foundOption && `${foundOption.label || 'Personalizado'}`;
  };

  const activeOptionLabel = useMemo(
    () => getActiveOptionByDates(),
    [dates, menuOptions],
  );

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
    return DateTime.fromMillis(date).toLocaleString(DateTime.DATE_MED);
  };
  const vw = useViewportWidth();
  const truncateOptions = (string = [], length = 4) => {
    if (vw < 800) {
      return truncateString(string, length);
    }
    if (string.length > 400) return truncateString(string, 4);
    return string;
  };
  return (
    <StyledButton ref={menuRef}>
      <Button
        ref={setReferenceElement}
        icon={<FontAwesomeIcon icon={faCalendar} />}
        title={truncateOptions(activeOptionLabel, 4) || 'Filtrar Fechas'}
        onClick={handleButtonClick}
      >
        {truncateOptions(activeOptionLabel, 4) || 'Filtrar Fechas'}
      </Button>
      {isMenuOpen && (
        <StyledMenu
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <Header>
            <Typography variant="h4" disableMargins>
              Rango Seleccionado
            </Typography>
            <Typography disableMargins>
              {activeOptionLabel ||
                `${dateForHuman(dates.startDate)} - ${dateForHuman(dates.endDate)}`}{' '}
              {/* Puedes usar un mensaje por defecto como "Seleccione un rango" */}
            </Typography>
          </Header>
          <Body>
            <Options>
              {sections.map((section, sectionIndex) => (
                <OptionsGroup key={sectionIndex}>
                  <h3>{section}</h3>
                  <Items>
                    {groupedOptions[section].map((option, optionIndex) => (
                      <StyledMenuItem
                        key={optionIndex}
                        isActive={activeOptionLabel === option.label}
                        onClick={() =>
                          handleMenuItemClick(
                            option.startDate,
                            option.endDate,
                            option.label,
                          )
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
      )}
      <div ref={setArrowElement} style={styles.arrow} />
    </StyledButton>
  );
};

const Header = styled.div`
  padding: 0.5em 1em;
  background-color: white;
`;

const Body = styled.div`
  padding: 1em;
  overflow-y: auto;
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2em 1em;
`;

const StyledButton = styled.div``;

const StyledMenu = styled.ul`
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-content: start;
  width: 100%;
  max-width: 800px;
  height: calc(100vh - 12em);
  padding: 0;
  overflow-y: scroll;
  overflow-y: hidden;
  list-style: none;
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: var(--border-radius);
  box-shadow: 0 0 10px rgb(0 0 0 / 21.2%);
  transition: opacity 0.2s ease-in-out;
`;

const StyledMenuItem = styled.li`
  display: flex;
  align-items: center;
  height: 2.6em;
  padding: 0 1em;
  margin: 0;
  font-size: 14px;
  font-weight: 450;
  color: ${(props) => (props.isActive ? '#ffffff' : '#000000')};
  text-transform: capitalize;
  list-style: none;
  background-color: ${(props) => (props.isActive ? '#2772e4' : '#ffffff')};
  border-radius: 6px;
`;
const OptionsGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5em;
  align-content: start;
  text-align: left;

  h3 {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
  }
`;

const Items = styled.div`
  display: grid;
  gap: 0.5em;
  padding: 0;
  margin: 0;
  text-align: left;

  @media (width <= 800px) {
    grid-template-columns: 1fr;
  }
`;
