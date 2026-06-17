import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type {
  AutoCompleteSelectOptions,
  AutoCompleteSuggestion,
} from '../types';

/**
 * Componente de autocompletado para la consola de desarrollador
 */
type AutoCompleteProps = {
  inputValue?: string;
  suggestions?: AutoCompleteSuggestion[];
  onSuggestionSelect?: (
    suggestion: AutoCompleteSuggestion,
    options?: AutoCompleteSelectOptions,
  ) => void;
  isVisible?: boolean;
  selectedIndex?: number;
  onSelectedIndexChange: (index: number) => void;
  inputElement?: HTMLInputElement | null;
};

type AutoCompletePosition = 'above' | 'below';

const AutoComplete = ({
  inputValue: _inputValue,
  suggestions,
  onSuggestionSelect,
  isVisible = false,
  selectedIndex = -1,
  onSelectedIndexChange,
  inputElement = null,
}: AutoCompleteProps) => {
  const [position, setPosition] = useState<AutoCompletePosition>('above'); // 'above' or 'below'
  const autoCompleteRef = useRef<HTMLDivElement | null>(null);
  // Detectar la mejor posición para el autocompletado
  useEffect(() => {
    if (!isVisible || !inputElement || !autoCompleteRef.current) {
      return;
    }

    const detectBestPosition = () => {
      const inputRect = inputElement.getBoundingClientRect();

      // Obtener la altura estimada del autocompletado
      const suggestionsCount = Math.min(suggestions?.length || 0, 8); // Máximo 8 items visibles
      const itemHeight = 45; // Altura aproximada de cada item
      const estimatedHeight = suggestionsCount * itemHeight + 20; // +20 para padding

      // Calcular espacio disponible arriba y abajo del input
      const spaceAbove = inputRect.top;
      const spaceBelow = window.innerHeight - inputRect.bottom;

      // Decidir posición basado en el espacio disponible
      let nextPosition: AutoCompletePosition;
      if (spaceAbove >= estimatedHeight && spaceAbove > spaceBelow) {
        nextPosition = 'above';
      } else if (spaceBelow >= estimatedHeight) {
        nextPosition = 'below';
      } else {
        // Si no hay suficiente espacio en ningún lado, usar el que tenga más espacio
        nextPosition = spaceAbove > spaceBelow ? 'above' : 'below';
      }

      setPosition((currentPosition) =>
        currentPosition === nextPosition ? currentPosition : nextPosition,
      );
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

  const handleSuggestionClick = (
    suggestion: AutoCompleteSuggestion,
    index: number,
  ) => {
    onSelectedIndexChange(index);
    onSuggestionSelect?.(suggestion, { trigger: 'click' });
  };

  const handleMouseEnter = (index: number) => {
    onSelectedIndexChange(index);
  };
  return (
    <AutoCompleteContainer
      ref={autoCompleteRef}
      $position={position}
      className="autocomplete-container"
    >
      <SuggestionsList>
        {suggestions.map((suggestion, index) => {
          const isInstant = !suggestion?.requiresInput;

          return (
            <SuggestionItem
              key={suggestion.command}
              $isSelected={index === selectedIndex}
              onClick={() => handleSuggestionClick(suggestion, index)}
              onMouseEnter={() => handleMouseEnter(index)}
            >
              <CommandRow>
                <CommandText $isSelected={index === selectedIndex}>
                  {suggestion.command}
                </CommandText>
                {isInstant && (
                  <InstantBadge title="Se ejecuta al hacer clic">
                    ⚡
                  </InstantBadge>
                )}
              </CommandRow>
              <DescriptionText $isSelected={index === selectedIndex}>
                {suggestion.description}
              </DescriptionText>
            </SuggestionItem>
          );
        })}
      </SuggestionsList>
    </AutoCompleteContainer>
  );
};

// Estilos
type AutoCompleteContainerProps = {
  $position: AutoCompletePosition;
};

type SuggestionItemProps = {
  $isSelected?: boolean;
};

type SuggestionTextProps = {
  $isSelected?: boolean;
};

const AutoCompleteContainer = styled.div<AutoCompleteContainerProps>`
  position: absolute;
  ${({ $position }) =>
    $position === 'above'
      ? `
    bottom: 100%;
    margin-bottom: 8px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  `
      : `
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

const SuggestionItem = styled.div<SuggestionItemProps>`
  padding: 8px 12px;
  color: ${({ $isSelected }) => ($isSelected ? 'white' : '#e0e0e0')};
  cursor: pointer;
  background: ${({ $isSelected }) =>
    $isSelected ? '#0d3863' : 'transparent'};
  border-bottom: 1px solid #2a2a2a;
  transition: all 0.1s ease;

  &:hover {
    color: white;
    background: #06c;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CommandText = styled.div<SuggestionTextProps>`
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: bold;
  color: ${({ $isSelected }) => ($isSelected ? 'white' : '#8ee78e')};
`;

const CommandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DescriptionText = styled.div<SuggestionTextProps>`
  font-size: 11px;
  color: ${({ $isSelected }) => ($isSelected ? 'white' : '#ccc')};
  opacity: 0.8;
`;

const InstantBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #0c0c0c;
  border-radius: 999px;
  box-shadow: 0 0 6px rgb(250 204 21 / 30%);
`;

const _SuggestionsFooter = styled.div`
  padding: 6px 12px;
  font-size: 10px;
  color: #888;
  text-align: center;
  background: #2d2d2d;
  border-top: 1px solid #333;
`;

export default AutoComplete;
