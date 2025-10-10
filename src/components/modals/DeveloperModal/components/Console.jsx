import { motion } from 'framer-motion';
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

import AutoComplete from './AutoComplete';

// Variantes de animación para los elementos de la consola
const consoleLineVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.1 }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] }
  }
};

/**
 * Componente que muestra la salida de la consola y el prompt para entrada de comandos
 */
const Console = ({
  consoleOutput,
  commandInput,
  setCommandInput,
  handleKeyDown,
  selectionMode,
  welcomeText,
  // Nuevas props para autocompletado
  autoCompleteSuggestions = [],
  showAutoComplete = false,
  autoCompleteSelectedIndex = -1,
  onAutoCompleteSuggestionSelect,
  onAutoCompleteSelectedIndexChange,
  // Nueva prop para filtrar selecciones
  onFilterSelection
}) => {
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  // (Removed auto-scroll logic as requested)  // Enfocar el input cuando el componente se monta y asegurar que capture eventos de teclado
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !selectionMode.active) {
        inputRef.current.focus();
        // Asegurar que el input esté realmente enfocado
        setTimeout(() => {
          if (!selectionMode.active) {
            inputRef.current?.focus();
          }
        }, 100);
      }
    };

    focusInput();

    // Re-enfocar cuando salgamos del modo selección
    if (!selectionMode.active) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [selectionMode.active]);// Función para manejar el clic en la consola
  const handleConsoleClick = (e) => {
    // No enfocar si estamos en modo de selección, pero no prevenir otros eventos
    if (selectionMode.active) {
      return;
    }

    // No enfocar si el clic fue en el input mismo
    if (e.target === inputRef.current) {
      return;
    }

    // No enfocar si el clic fue en elementos interactivos
    if (e.target.closest('.selectable-item') ||
      e.target.closest('.autocomplete-container') ||
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.closest('[onclick]')) {
      return;
    }

    // Enfocar el input
    inputRef.current?.focus();
  };

  return (
    <ConsoleContainer>
      {/* Área de contenido scrolleable */}
      <ConsoleTerminal
        ref={terminalRef}
        className="console-terminal"
        onClick={handleConsoleClick}
      >
        {/* Texto de bienvenida */}
        <WelcomeText>
          {welcomeText}
        </WelcomeText>

        {/* Salida de la consola */}
        {consoleOutput.map((line) => (
          <motion.div
            key={line.id}
            initial="hidden"
            animate="visible"
            variants={consoleLineVariants}
          >
            <ConsoleLine type={line.type}>
              {line.type === 'command' ? (
                <div className="content">
                  <span className="prompt">{line.content.prompt}</span>
                  <span className="user-command">{line.content.userCommand}</span>
                </div>
              ) : line.html ? (
                <div
                  className="content"
                  dangerouslySetInnerHTML={{ __html: line.content }}
                />
              ) : (
                <div className="content">{line.content}</div>
              )}
            </ConsoleLine>
          </motion.div>
        ))}
      </ConsoleTerminal>

      {/* Input fijo en la parte inferior */}
      <FixedInputContainer>
        <AutoComplete
          inputValue={commandInput}
          suggestions={autoCompleteSuggestions}
          onSuggestionSelect={onAutoCompleteSuggestionSelect}
          isVisible={showAutoComplete && !selectionMode.active}
          selectedIndex={autoCompleteSelectedIndex}
          onSelectedIndexChange={onAutoCompleteSelectedIndexChange}
          inputElement={inputRef.current}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ConsolePrompt>C:\\VentaMax&gt;</ConsolePrompt>
          <ConsoleInput
            ref={inputRef}
            value={commandInput}
            onChange={(e) => {
              setCommandInput(e.target.value);
              // Si estamos en modo selección, filtrar las opciones
              if (selectionMode.active && onFilterSelection) {
                onFilterSelection(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectionMode.active 
                ? 'Escribe para filtrar las opciones...' 
                : 'Escriba un comando...'
            }
            autoFocus
            style={{
              opacity: 1,
              cursor: 'text'
            }}
          />
        </div>
      </FixedInputContainer>
    </ConsoleContainer>
  );
};

// Estilos del componente
const ConsoleContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ConsoleTerminal = styled.div`
  background-color: #0c0c0c;
  color: #c0c0c0;
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  cursor: text; /* Cursor de texto para indicar que es clickeable */
  
  /* Estilo para elementos seleccionables */
  .selectable-item {
    transition: background-color 0.1s ease;
    cursor: pointer !important; /* Mantener cursor pointer para elementos seleccionables */
    
    &:hover {
      background-color: rgba(0, 102, 204, 0.15);
    }
    
    &.selected {
      position: relative;
      
      &:after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px solid #0066cc;
        pointer-events: none;
        z-index: 10;
      }
    }
  }
  
  /* Authentic Windows CMD scrollbar */
  &::-webkit-scrollbar { 
    width: 16px; 
  }
  &::-webkit-scrollbar-track { 
    background: #000; 
  }
  &::-webkit-scrollbar-thumb { 
    background: #808080; 
    border: 1px solid #000;
    
    &:hover {
      background: #a0a0a0;
    }
    
    &:active {
      background: #606060;
    }
  }
  &::-webkit-scrollbar-corner {
    background: #000;
  }
`;

const WelcomeText = styled.div`
  color: #c0c0c0;
  margin-bottom: 0;
  white-space: pre-line;
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
`;

const ConsoleLine = styled.div`
  margin-bottom: ${props => {
    switch (props.type) {
      case 'command': return '2px';      // Poco espacio después de comandos
      case 'error': return '8px';       // Más espacio después de errores
      default: return '12px';           // Espacio generoso después de respuestas del sistema
    }
  }};
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  
  .content {
    color: ${props => {
    switch (props.type) {
      case 'command': return '#f5deb3'; // Color cremita para comandos del usuario
      case 'error': return '#ff6b6b';   // Rojo suave para errores
      case 'selection': return '#66d9ef'; // Azul claro para las selecciones interactivas
      default: return '#c0c0c0';        // Classic CMD silver/light gray para respuestas del sistema
    }
  }};
  }
  
  .prompt {
    color: #c0c0c0; // Color del sistema para el prompt C:\VentaMax>
  }
  
  .user-command {
    color: #f5deb3; // Color cremita solo para lo que escribe el usuario
  }
  
  .selection-active {
    color: #ffffff;
    background-color: #0066cc;
    padding: 0 5px;
    margin-left: -5px;
    border-radius: 2px;
  }
  
  .selection-inactive {
    color: #c0c0c0;
  }
`;

const ConsolePrompt = styled.span`
  color: #c0c0c0;
  margin-right: 0;
  user-select: none;
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
`;

const ConsoleInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #f5deb3; /* Color cremita/beige para diferenciarlo del sistema */
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
  outline: none;
  caret-color: #f5deb3;
  margin-left: 0;
  
  &::placeholder {
    color: #606060;
  }
  
  &::selection {
    background: #f5deb3;
    color: #000;
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const FixedInputContainer = styled.div`
  position: relative;
  background-color: #0c0c0c;
  border-top: 1px solid #333;
  padding: 12px 16px;
  flex-shrink: 0;
`;

export default Console;
