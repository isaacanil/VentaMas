import React, { useEffect } from 'react';
import styled from 'styled-components';

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
  setConsoleOutput
}) => {
  // No renderizar nada si el modo de selección no está activo
  if (!active) return null;

  /**
   * Muestra la lista de selección
   */
  const displaySelectionList = () => {
    // Eliminar la lista anterior si existe
    setConsoleOutput(prev => prev.filter(line => 
      line.type !== 'selection' || 
      (line.type === 'selection' && line.command !== command)
    ));
    
    // Crear la nueva línea de selección con formato HTML y elementos clicables
    const selectionLine = {
      id: Date.now() + Math.random(),
      content: `<div style="color:#66d9ef;font-weight:bold;margin-bottom:10px;">${title}</div>
<div style="margin-left:4px;margin-bottom:10px;">
${items.map((item, index) => {
  const isSelected = index === selectedIndex;
  const itemClass = isSelected ? 'selection-active' : 'selection-inactive';
  const icon = isSelected ? '🔹' : '▫️';  // Hacer cada elemento clicable - ahora solo requiere un clic para confirmar si ya está seleccionado
  return `<div style="padding:4px 0;cursor:pointer;margin-bottom:2px;" 
      onclick="window.selectItem(${index}, event)" 
      data-index="${index}" 
      class="selectable-item ${isSelected ? 'selected' : ''}">
      <span class="${itemClass}">${icon} ${item.display || item.name || item}</span>
  </div>`;
}).join('')}
</div>
<div style="color:#888;font-size:12px;margin-top:5px;border-top:1px solid #333;padding-top:8px;">
🔸 <strong>Filtrar:</strong> Escribe en la consola para filtrar opciones<br/>
🔸 <strong>Navegación:</strong> ESC para cancelar<br/>
🔸 <strong>Clic:</strong> Una vez para seleccionar, dos veces en el mismo para confirmar
</div>`,
      type: 'selection',
      html: true,
      command,
    };
    
    setConsoleOutput(prev => [...prev, selectionLine]);
    
      // Definir funciones globales para manejar los clics
    window.selectItem = (index, event) => {
      // Evitar que el evento burbujee y cause scroll indeseado
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
        // Si el elemento ya está seleccionado, confirmar la selección
      if (index === selectedIndex) {
        // Segundo clic en el mismo elemento = confirmar
        // Primero eliminar la lista de selección de la consola
        setConsoleOutput(prev => prev.filter(line => 
          line.type !== 'selection' || 
          (line.type === 'selection' && line.command !== command)
        ));
        
        setTimeout(() => {
          onSelectionConfirm();
        }, 0);
        return;
      }
      
      // Primer clic en elemento diferente = seleccionar
      onSelectIndex?.(index);
      
      // Crear nueva selección sin resetear el scroll
      const newLine = { ...selectionLine };
      newLine.id = Date.now() + Math.random();
      newLine.content = newLine.content.replace(/class="selectable-item selected"/g, 'class="selectable-item"')
        .replace(/class="selection-active"/g, 'class="selection-inactive"')
        .replace(/🔹/g, '▫️');
          
      // Marcar el elemento seleccionado
      newLine.content = newLine.content.replace(
        `data-index="${index}" class="selectable-item "`, 
        `data-index="${index}" class="selectable-item selected"`
      ).replace(
        `data-index="${index}"><span class="selection-inactive">▫️`, 
        `data-index="${index}"><span class="selection-active">🔹`
      );
      
      // Actualizar output sin cambiar scroll
      setConsoleOutput(prev => [
        ...prev.filter(line => 
          line.type !== 'selection' || 
          (line.type === 'selection' && line.command !== command)
        ),
        newLine
      ]);
      
    };    // Eliminar la función de confirmSelection ya que ahora se maneja en selectItem
    window.confirmSelection = undefined;
  };  // Mostrar la lista de selección al montar el componente
  useEffect(() => {    if (active) {
      console.log('SelectionMode - Rendering with items:', items);
      displaySelectionList();
    }
    
    // Limpiar las funciones globales al desmontar
    return () => {
      window.selectItem = undefined;
      window.confirmSelection = undefined;
    };  }, [active, selectedIndex, items]); // Re-renderizar cuando cambia el índice seleccionado o los items filtrados
    return (
    <SelectionModeIndicator>
      <span>🎯 MODO DE SELECCIÓN ACTIVO</span>
      <span>Escribe para filtrar • Clic para seleccionar • ESC para cancelar</span>
    </SelectionModeIndicator>
  );
};

// Indicador visual para el modo de selección
const SelectionModeIndicator = styled.div`
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
  color: white;
  padding: 8px 16px;
  margin: -16px -16px 12px -16px; /* Compensar el padding del ConsoleTerminal */
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
  font-size: 13px;
  font-weight: bold;
  z-index: 100;
  border-bottom: 2px solid #0055aa;
  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
  
  span:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  span:last-child {
    font-weight: normal;
    font-size: 12px;
    opacity: 0.95;
    background: rgba(255,255,255,0.1);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.2);
  }
`;

export default SelectionMode;
