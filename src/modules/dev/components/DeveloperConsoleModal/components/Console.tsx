import { m, type Variants } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import AutoComplete from './AutoComplete';
import type {
  ConsoleLine as ConsoleLineRecord,
  ConsoleLineType,
  ConsoleProps,
  AutoCompleteSuggestion,
  SelectionItem,
} from '../types';

const EMPTY_AUTOCOMPLETE_SUGGESTIONS: AutoCompleteSuggestion[] = [];

const resolveSelectionItemLabel = (item: SelectionItem) => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    const candidate = item as {
      display?: string;
      name?: string;
      title?: string;
      label?: string;
    };
    return (
      candidate.display ||
      candidate.name ||
      candidate.title ||
      candidate.label ||
      String(item)
    );
  }
  return String(item);
};

const getSelectionItemKey = (command: string, item: SelectionItem) => {
  if (typeof item === 'object' && item !== null) {
    const candidate = item as {
      id?: unknown;
      key?: unknown;
      value?: unknown;
    };
    const stableId = candidate.id ?? candidate.key ?? candidate.value;
    if (stableId != null) return `${command}-${String(stableId)}`;
  }
  return `${command}-${resolveSelectionItemLabel(item)}`;
};

// Variantes de animación para los elementos de la consola
const consoleLineVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.1 },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.15,
      ease: [0, 0, 0.2, 1] as [number, number, number, number],
    },
  },
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
  autoCompleteSuggestions = EMPTY_AUTOCOMPLETE_SUGGESTIONS,
  showAutoComplete = false,
  autoCompleteSelectedIndex = -1,
  onAutoCompleteSuggestionSelect,
  onAutoCompleteSelectedIndexChange,
  // Nueva prop para filtrar selecciones
  onFilterSelection,
}: ConsoleProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
    null,
  );
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const handleAutoCompleteIndexChange = useCallback(
    (index: number) => {
      onAutoCompleteSelectedIndexChange?.(index);
    },
    [onAutoCompleteSelectedIndexChange],
  );

  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    setInputElement(node);
  }, []);

  // (Removed auto-scroll logic as requested)  // Enfocar el input cuando el componente se monta y asegurar que capture eventos de teclado
  useEffect(() => {
    const focusTimers: number[] = [];
    const focusInput = () => {
      if (inputRef.current && !selectionMode.active) {
        inputRef.current.focus();
        // Asegurar que el input esté realmente enfocado
        const focusTimer = window.setTimeout(() => {
          if (!selectionMode.active) {
            inputRef.current?.focus();
          }
        }, 100);
        focusTimers.push(focusTimer);
      }
    };

    focusInput();

    // Re-enfocar cuando salgamos del modo selección
    if (!selectionMode.active) {
      const refocusTimer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      focusTimers.push(refocusTimer);
    }
    return () => {
      focusTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [selectionMode.active]); // Función para manejar el clic en la consola
  const handleConsoleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // No enfocar si estamos en modo de selección, pero no prevenir otros eventos
    if (selectionMode.active) {
      return;
    }

    // No enfocar si el clic fue en el input mismo
    if (e.target === inputRef.current) {
      return;
    }

    const target = e.target instanceof Element ? e.target : null;
    // No enfocar si el clic fue en elementos interactivos
    if (
      target?.closest('.selectable-item') ||
      target?.closest('.autocomplete-container') ||
      target?.closest('button') ||
      target?.closest('a') ||
      target?.closest('[onclick]')
    ) {
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
        <WelcomeText>{welcomeText}</WelcomeText>

        {/* Salida de la consola */}
        {consoleOutput.map((line: ConsoleLineRecord) => (
          <m.div
            key={line.id}
            initial="hidden"
            animate="visible"
            variants={consoleLineVariants}
          >
            <ConsoleLineEntry type={line.type}>
              {line.type === 'command' ? (
                <div className="content">
                  <span className="prompt">{line.content.prompt}</span>
                  <span className="user-command">
                    {line.content.userCommand}
                  </span>
                </div>
              ) : line.type === 'selection' ? (
                <SelectionContent className="content">
                  <div className="selection-title">{line.content.title}</div>
                  <div className="selection-list">
                    {line.content.items.map((item, index) => {
                      const isSelected = index === line.content.selectedIndex;
                      const itemClass = isSelected
                        ? 'selection-active'
                        : 'selection-inactive';
                      const icon = isSelected ? '🔹' : '▫️';
                      return (
                        <div
                          key={getSelectionItemKey(line.content.command, item)}
                          className={`selectable-item ${
                            isSelected ? 'selected' : ''
                          }`}
                          data-index={index}
                          data-selection-command={line.content.command}
                        >
                          <span className={itemClass}>
                            {icon} {resolveSelectionItemLabel(item)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="selection-help">
                    🔸 <strong>Filtrar:</strong> Escribe en la consola para
                    filtrar opciones
                    <br />
                    🔸 <strong>Navegación:</strong> ESC para cancelar
                    <br />
                    🔸 <strong>Clic:</strong> Una vez para seleccionar, dos
                    veces en el mismo para confirmar
                  </div>
                </SelectionContent>
              ) : (
                <div className="content">{line.content}</div>
              )}
            </ConsoleLineEntry>
          </m.div>
        ))}
      </ConsoleTerminal>

      {/* Input fijo en la parte inferior */}
      <FixedInputContainer>
        {inputElement && (
          <AutoComplete
            inputValue={commandInput}
            suggestions={autoCompleteSuggestions}
            onSuggestionSelect={onAutoCompleteSuggestionSelect}
            isVisible={showAutoComplete && !selectionMode.active}
            selectedIndex={autoCompleteSelectedIndex}
            onSelectedIndexChange={handleAutoCompleteIndexChange}
            inputElement={inputElement}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ConsolePrompt>C:\\VentaMax&gt;</ConsolePrompt>
          <ConsoleInput
            ref={setInputRef}
            value={commandInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
            style={{
              opacity: 1,
              cursor: 'text',
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
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  padding: 16px;
  flex: 1;
  overflow: hidden auto;
  position: relative;
  cursor: text; /* Cursor de texto para indicar que es clickeable */

  /* Estilo para elementos seleccionables */
  .selectable-item {
    transition: background-color 0.1s ease;
    cursor: pointer !important; /* Mantener cursor pointer para elementos seleccionables */

    &:hover {
      background-color: rgb(0 102 204 / 15%);
    }

    &.selected {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px solid #06c;
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
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
`;

const SelectionContent = styled.div`
  .selection-title {
    color: #66d9ef;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .selection-list {
    margin-left: 4px;
    margin-bottom: 10px;
  }

  .selectable-item {
    padding: 4px 0;
    margin-bottom: 2px;
  }

  .selection-help {
    color: #888;
    font-size: 12px;
    margin-top: 5px;
    border-top: 1px solid #333;
    padding-top: 8px;
  }
`;

interface ConsoleLineProps {
  type: ConsoleLineType;
}

const ConsoleLineEntry = styled.div<ConsoleLineProps>`
  margin-bottom: ${(props: ConsoleLineProps) => {
    switch (props.type) {
      case 'command':
        return '2px'; // Poco espacio después de comandos
      case 'error':
        return '8px'; // Más espacio después de errores
      default:
        return '12px'; // Espacio generoso después de respuestas del sistema
    }
  }};
  white-space: pre-wrap;
  overflow-wrap: break-word;
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;

  .content {
    color: ${(props: ConsoleLineProps) => {
      switch (props.type) {
        case 'command':
          return '#f5deb3'; // Color cremita para comandos del usuario
        case 'error':
          return '#ff6b6b'; // Rojo suave para errores
        case 'selection':
          return '#66d9ef'; // Azul claro para las selecciones interactivas
        default:
          return '#c0c0c0'; // Classic CMD silver/light gray para respuestas del sistema
      }
    }};
  }

  .prompt {
    color: #c0c0c0; /* Color del sistema para el prompt C:\VentaMax> */
  }

  .user-command {
    color: #f5deb3; /* Color cremita solo para lo que escribe el usuario */
  }

  .selection-active {
    color: #fff;
    background-color: #06c;
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
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 400;
`;

const ConsoleInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #f5deb3; /* Color cremita/beige para diferenciarlo del sistema */
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
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

const _InputContainer = styled.div`
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
