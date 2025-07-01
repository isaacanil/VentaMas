import React, { useState, useRef, useEffect } from 'react'
import { Input } from 'antd'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useClickOutSide } from '../../../hooks/useClickOutSide'
import { ButtonIconMenu } from '../../../views/templates/system/Button/ButtonIconMenu'
import { icons } from '../../../constants/icons/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

export const SearchPanel = ({ 
  isOpen, 
  onClose, 
  searchData, 
  setSearchData, 
  displayName = "", 
  sectionName = "" 
}) => {
  const searchDrawerRef = useRef(null)
  const [tempSearchData, setTempSearchData] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTempSearchData(searchData || '')
      // Enfocar el input después de que se abra el panel
      setTimeout(() => {
        const input = document.querySelector('#search-panel-input')
        if (input) {
          input.focus()
        }
      }, 100)
    }
  }, [isOpen, searchData])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setTempSearchData(value)
    if (setSearchData) {
      setSearchData(value)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onClose()
    }
  }

  const handleClearSearch = () => {
    setTempSearchData('')
    if (setSearchData) {
      setSearchData('')
    }
  }

  useClickOutSide(searchDrawerRef, isOpen, onClose)

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
              scale: 0.95
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              y: -15, 
              scale: 0.95
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
          >
          <SearchPanelContent>
            <Input
              id="search-panel-input"
              prefix={icons.operationModes.search}
              placeholder={`Buscar ${displayName || sectionName || ""}...`}
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
            >
              <FontAwesomeIcon icon={faTimes} />
            </CloseButton>
          </SearchPanelContent>
        </SearchPanelContainer>
        </>
      )}
    </AnimatePresence>
  )
}

const SearchOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(74, 145, 226, 0.70),
    rgba(80, 200, 120, 0.30) 10%,
    rgba(255, 255, 255, 0.10),
    transparent 35vh
  );
  z-index: 1001;
  cursor: pointer;
`

const SearchPanelContainer = styled.div`
  position: fixed;
  top: 0.5em;
  left: 3%;
  right: 3%;
  background-color: #ffffff;
  padding: 0.4rem 0.6rem;
  border-radius: 50px;
  max-width: 420px;
  margin: 0 auto;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(0, 0, 0, 0.41);
  backdrop-filter: blur(10px);
  z-index: 1002;
`

const SearchPanelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  
  .ant-input-affix-wrapper {
    flex: 1;
    border-radius: 50px;
    border: none;
    background-color: transparent;
    padding: 0.2rem 0.8rem;
    
    .ant-input {
      background-color: transparent;
      border: none;
      box-shadow: none;
      font-size: 1rem;
      padding: 0.3rem 0;
      
      &::placeholder {
        color: rgba(0, 0, 0, 0.5);
        font-weight: 400;
      }
    }
    
    .ant-input-prefix {
      margin-right: 0.5rem;
      color: rgba(0, 0, 0, 0.45);
    }
    
    .ant-input-clear-icon {
      color: rgba(0, 0, 0, 0.35);
      
      &:hover {
        color: rgba(0, 0, 0, 0.6);
      }
    }
    
    &:hover, &:focus-within {
      border-color: transparent;
      box-shadow: none;
    }
  }
`

const CloseButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  width: 2.2em;
  height: 2.2em;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  svg {
    font-size: 0.9em;
    color: rgba(0, 0, 0, 0.6);
  }
` 