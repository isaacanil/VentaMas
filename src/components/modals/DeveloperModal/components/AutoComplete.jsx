import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

/**
 * Componente de autocompletado para la consola de desarrollador
 */
const AutoComplete = ({ 
  inputValue: _inputValue, 
  suggestions, 
  onSuggestionSelect, 
  isVisible = false,
  selectedIndex = -1,
  onSelectedIndexChange,
  inputElement = null
}) => {
  const [position, setPosition] = useState('above'); // 'above' or 'below'
  const autoCompleteRef = useRef(null);  
  // Detectar la mejor posición para el autocompletado
  useEffect(() => {
    if (!isVisible || !inputElement || !autoCompleteRef.current) {
      return;
    }

    const detectBestPosition = () => {
      try {
        const inputRect = inputElement.getBoundingClientRect();
        const _autoCompleteElement = autoCompleteRef.current;
        
        // Obtener la altura estimada del autocompletado
        const suggestionsCount = Math.min(suggestions?.length || 0, 8); // Máximo 8 items visibles
        const itemHeight = 45; // Altura aproximada de cada item
        const estimatedHeight = suggestionsCount * itemHeight + 20; // +20 para padding
        
        // Calcular espacio disponible arriba y abajo del input
        const spaceAbove = inputRect.top;
        const spaceBelow = window.innerHeight - inputRect.bottom;
        
        // Decidir posición basado en el espacio disponible
        if (spaceAbove >= estimatedHeight && spaceAbove > spaceBelow) {
          setPosition('above');
        } else if (spaceBelow >= estimatedHeight) {
          setPosition('below');
        } else {
          // Si no hay suficiente espacio en ningún lado, usar el que tenga más espacio
          setPosition(spaceAbove > spaceBelow ? 'above' : 'below');
        }
      } catch (_error) {
        // En caso de error, usar posición por defecto
        setPosition('above');
      }
    };

    // Detectar posición inmediatamente
    detectBestPosition();

    // Detectar posición en scroll o resize
    const handleResize = () => detectBestPosition();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, inputElement, suggestions?.length]);

  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = (suggestion, index) => {
    onSelectedIndexChange(index);
    onSuggestionSelect(suggestion);
  };

  const handleMouseEnter = (index) => {
    onSelectedIndexChange(index);
  };  return (
    <AutoCompleteContainer ref={autoCompleteRef} position={position} className="autocomplete-container">
      <SuggestionsList>
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={index}
            isSelected={index === selectedIndex}
            onClick={() => handleSuggestionClick(suggestion, index)}
            onMouseEnter={() => handleMouseEnter(index)}
          >
            <CommandText>{suggestion.command}</CommandText>
            <DescriptionText>{suggestion.description}</DescriptionText>
          </SuggestionItem>
        ))}
      </SuggestionsList>
    </AutoCompleteContainer>
  );
};

// Estilos
const AutoCompleteContainer = styled.div`
  position: absolute;
  ${props => props.position === 'above' ? `
    bottom: 100%;
    margin-bottom: 8px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  ` : `
    top: 100%;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `}
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
  margin: 1em;
  font-family: 'Courier New', monospace;
`;

const SuggestionsList = styled.div`
  max-height: 290px;
  overflow-y: auto;
  
  /* Personalizar scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #2a2a2a;
  background: ${props => props.isSelected ? '#0d3863' : 'transparent'};
  color: ${props => props.isSelected ? 'white' : '#e0e0e0'};
  transition: all 0.1s ease;

  &:hover {
    background: #0066cc;
    color: white;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CommandText = styled.div`
  font-weight: bold;
  font-size: 13px;
  color: ${props => props.theme?.isSelected ? 'white' : '#8ee78e'};
  margin-bottom: 2px;
`;

const DescriptionText = styled.div`
  font-size: 11px;
  opacity: 0.8;
  color: ${props => props.theme?.isSelected ? 'white' : '#ccc'};
`;

const _SuggestionsFooter = styled.div`
  padding: 6px 12px;
  background: #2d2d2d;
  border-top: 1px solid #333;
  color: #888;
  font-size: 10px;
  text-align: center;
`;

export default AutoComplete;
