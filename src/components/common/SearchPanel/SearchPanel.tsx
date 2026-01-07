import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useClickOutSide } from '@/hooks/useClickOutSide';

export const SearchPanel = ({
  isOpen,
  onClose,
  searchData,
  setSearchData,
  displayName = '',
  sectionName = '',
}) => {
  const searchDrawerRef = useRef(null);
  // Derivar el estado de searchData directamente
  const [tempSearchData, setTempSearchData] = useState(searchData || '');

  // Solo actualizar el tempSearchData cuando el panel se abre
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevSearchData, setPrevSearchData] = useState(searchData);

  // Sincronizar tempSearchData cuando el panel se abre o searchData cambia
  if (isOpen !== prevIsOpen || searchData !== prevSearchData) {
    setPrevIsOpen(isOpen);
    setPrevSearchData(searchData);

    if (isOpen) {
      setTempSearchData(searchData || '');
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Enfocar el input después de que se abra el panel
      setTimeout(() => {
        const input =
          document.querySelector<HTMLInputElement>('#search-panel-input');
        input?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTempSearchData(value);
    if (setSearchData) {
      setSearchData(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onClose();
    }
  };

  const handleClearSearch = () => {
    setTempSearchData('');
    if (setSearchData) {
      setSearchData('');
    }
  };

  useClickOutSide(searchDrawerRef, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <SearchOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <SearchPanelContainer
            ref={searchDrawerRef}
            as={motion.div}
            initial={{
              opacity: 0,
              y: -20,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -15,
              scale: 0.95,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            <SearchPanelContent>
              <Input
                id="search-panel-input"
                prefix={icons.operationModes.search}
                placeholder={`Buscar ${displayName || sectionName || ''}...`}
                value={tempSearchData}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                size="large"
                autoFocus
                allowClear
                onClear={handleClearSearch}
              />
              <CloseButton
                as={motion.div}
                onClick={onClose}
                role="button"
                aria-label="Cerrar búsqueda"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onClose()}
              >
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </SearchPanelContent>
          </SearchPanelContainer>
        </>
      )}
    </AnimatePresence>
  );
};

const SearchOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1001;
  cursor: pointer;
  background: linear-gradient(
    180deg,
    rgb(74 145 226 / 70%),
    rgb(80 200 120 / 30%) 10%,
    rgb(255 255 255 / 10%),
    transparent 35vh
  );
`;

const SearchPanelContainer = styled.div`
  position: fixed;
  top: 0.5em;
  right: 3%;
  left: 3%;
  z-index: 1002;
  max-width: 420px;
  padding: 0.4rem 0.6rem;
  margin: 0 auto;
  background-color: #fff;
  border: 2px solid rgb(0 0 0 / 41%);
  border-radius: 50px;
  box-shadow:
    0 8px 25px rgb(0 0 0 / 15%),
    0 2px 10px rgb(0 0 0 / 8%);
  backdrop-filter: blur(10px);
`;

const SearchPanelContent = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;

  .ant-input-affix-wrapper {
    flex: 1;
    padding: 0.2rem 0.8rem;
    background-color: transparent;
    border: none;
    border-radius: 50px;

    .ant-input {
      padding: 0.3rem 0;
      font-size: 1rem;
      background-color: transparent;
      border: none;
      box-shadow: none;

      &::placeholder {
        font-weight: 400;
        color: rgb(0 0 0 / 50%);
      }
    }

    .ant-input-prefix {
      margin-right: 0.5rem;
      color: rgb(0 0 0 / 45%);
    }

    .ant-input-clear-icon {
      color: rgb(0 0 0 / 35%);

      &:hover {
        color: rgb(0 0 0 / 60%);
      }
    }

    &:hover,
    &:focus-within {
      border-color: transparent;
      box-shadow: none;
    }
  }
`;

const CloseButton = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.2em;
  height: 2.2em;
  cursor: pointer;
  background-color: rgb(0 0 0 / 8%);
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 50%;

  svg {
    font-size: 0.9em;
    color: rgb(0 0 0 / 60%);
  }
`;
