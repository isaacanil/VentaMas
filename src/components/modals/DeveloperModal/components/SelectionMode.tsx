import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { ConsoleLine, SelectionItem, SelectionModeProps } from '../types';

/**
 * Componente para manejar el modo de selección interactiva en la consola
 */
const SelectionMode = ({
  active,
  items,
  selectedIndex,
  title,
  command,
  onExitSelectionMode: _onExitSelectionMode,
  onSelectionConfirm,
  onSelectIndex,
  consoleOutput: _consoleOutput,
  setConsoleOutput,
}: SelectionModeProps) => {
  const isSelectionLineForCommand = useCallback(
    (line: ConsoleLine) =>
      line.type === 'selection' && line.command === command,
    [command],
  );

  const resolveItemLabel = (item: SelectionItem) => {
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

  const buildSelectionContent = useCallback(
    (currentSelectedIndex: number) =>
      `<div style="color:#66d9ef;font-weight:bold;margin-bottom:10px;">${title}</div>
<div style="margin-left:4px;margin-bottom:10px;">
${items
  .map((item, index) => {
    const isSelected = index === currentSelectedIndex;
    const itemClass = isSelected ? 'selection-active' : 'selection-inactive';
    const icon = isSelected ? '🔹' : '▫️';
    return `<div style="padding:4px 0;cursor:pointer;margin-bottom:2px;" 
      data-index="${index}" 
      data-selection-command="${command}"
      class="selectable-item ${isSelected ? 'selected' : ''}">
      <span class="${itemClass}">${icon} ${resolveItemLabel(item)}</span>
  </div>`;
  })
  .join('')}
</div>
<div style="color:#888;font-size:12px;margin-top:5px;border-top:1px solid #333;padding-top:8px;">
🔸 <strong>Filtrar:</strong> Escribe en la consola para filtrar opciones<br/>
🔸 <strong>Navegación:</strong> ESC para cancelar<br/>
🔸 <strong>Clic:</strong> Una vez para seleccionar, dos veces en el mismo para confirmar
</div>`,
    [command, items, title],
  );

  const removeSelectionLine = useCallback(() => {
    setConsoleOutput((prev) =>
      prev.filter((line) => !isSelectionLineForCommand(line)),
    );
  }, [isSelectionLineForCommand, setConsoleOutput]);

  const upsertSelectionLine = useCallback(
    (currentSelectedIndex: number) => {
      const content = buildSelectionContent(currentSelectedIndex);

      setConsoleOutput((prev) => {
        const existingIndex = prev.findIndex(isSelectionLineForCommand);
        if (existingIndex < 0) {
          const selectionLine: ConsoleLine = {
            id: Date.now() + Math.random(),
            content,
            type: 'selection',
            html: true,
            command,
          };
          return [...prev, selectionLine];
        }

        const existingLine = prev[existingIndex];
        if (existingLine.type !== 'selection') {
          return prev;
        }
        if (
          existingLine.content === content &&
          existingLine.command === command &&
          existingLine.html === true
        ) {
          return prev;
        }

        const updatedLine: ConsoleLine = {
          ...existingLine,
          content,
          html: true,
          command,
        };

        return prev.map((line, index) =>
          index === existingIndex ? updatedLine : line,
        );
      });
    },
    [buildSelectionContent, command, isSelectionLineForCommand, setConsoleOutput],
  );

  const handleSelectionItemClick = useCallback(
    (index: number, event?: Event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (index === selectedIndex) {
        removeSelectionLine();

        setTimeout(() => {
          onSelectionConfirm();
        }, 0);
        return;
      }

      onSelectIndex?.(index);
    },
    [onSelectIndex, onSelectionConfirm, removeSelectionLine, selectedIndex],
  );

  /**
   * Muestra la lista de selección
   */
  const displaySelectionList = useCallback(() => {
    upsertSelectionLine(selectedIndex);

    // Compatibilidad con flujos legados que llamen selectItem desde window.
    window.selectItem = handleSelectionItemClick;
    window.confirmSelection = undefined;
  }, [handleSelectionItemClick, selectedIndex, upsertSelectionLine]);

  const handleDelegatedSelectionClick = useCallback(
    (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const itemEl = target.closest('.selectable-item');
      if (!itemEl) return;

      const itemCommand = itemEl.getAttribute('data-selection-command');
      if (itemCommand !== command) return;

      const index = Number(itemEl.getAttribute('data-index'));
      if (!Number.isInteger(index) || index < 0) return;

      handleSelectionItemClick(index, event);
    },
    [command, handleSelectionItemClick],
  );

  // Mostrar la lista de selección al montar el componente
  useEffect(() => {
    if (active) {
      displaySelectionList();
    }

    const terminal = document.querySelector('.console-terminal');
    if (active && terminal) {
      terminal.addEventListener('click', handleDelegatedSelectionClick);
    }

    // Limpiar las funciones globales al desmontar
    return () => {
      if (terminal) {
        terminal.removeEventListener('click', handleDelegatedSelectionClick);
      }
      window.selectItem = undefined;
      window.confirmSelection = undefined;
    };
  }, [active, displaySelectionList, handleDelegatedSelectionClick]); // Re-renderizar cuando cambia la selección o el filtro

  if (!active) {
    return null;
  }

  return (
    <SelectionModeIndicator>
      <span>🎯 MODO DE SELECCIÓN ACTIVO</span>
      <span>
        Escribe para filtrar • Clic para seleccionar • Doble clic para confirmar • ESC para cancelar
      </span>
    </SelectionModeIndicator>
  );
};

// Indicador visual para el modo de selección
const SelectionModeIndicator = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 32px;
  margin: -16px -16px 12px; /* Compensar el padding del ConsoleTerminal */
  font-family: Consolas, 'Lucida Console', 'Courier New', monospace;
  font-size: 13px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #06c 0%, #049 100%);
  border-bottom: 2px solid #05a;
  box-shadow: 0 3px 8px rgb(0 0 0 / 40%);

  span:first-child {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  span:last-child {
    padding: 4px 8px;
    font-size: 12px;
    font-weight: normal;
    background: rgb(255 255 255 / 10%);
    border: 1px solid rgb(255 255 255 / 20%);
    border-radius: 4px;
    opacity: 0.95;
  }
`;

export default SelectionMode;
