/**
 * Command Pattern Utilities
 * Simplifica la implementación de handlers reduciendo código repetitivo
 */
import { OutputUtils } from './OutputUtils';
import { ValidationUtils } from './ValidationUtils';

export class CommandPatternUtils {
  
  // ═══════════════════════════════════════════════════════════════════════════
  //                              CORE UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crea un ejecutor de comandos con manejo automático de errores
   */
  static createCommandExecutor(config) {
    const { 
      commandMap, 
      prefixCommands = [], 
      context, 
      addOutput, 
      handlerName 
    } = config;

    return async function executeCommand(command) {
      const cmd = command.toLowerCase().trim();
      
      try {
        // Comandos exactos
        if (commandMap[cmd]) {
          return await commandMap[cmd].call(context, command);
        }
        
        // Comandos con prefijos
        for (const prefix of prefixCommands) {
          if (cmd.startsWith(prefix + ' ')) {
            const handler = commandMap[prefix];
            if (handler) {
              return await handler.call(context, command);
            }
          }
        }
        
        // Comando no reconocido
        addOutput(`${handlerName} cannot execute: "${command}"`, 'error');
        return { success: false };
        
      } catch (error) {
        console.error(`Error in ${handlerName}:`, error);
        addOutput(OutputUtils.formatError(`ejecutar comando "${command}"`, error), 'error');
        return { success: false, error };
      }
    };
  }

  /**
   * Crea un verificador de comandos estándar
   */
  static createCanHandleChecker(commandMap, prefixCommands = []) {
    return function canHandle(command) {
      const cmd = command.toLowerCase().trim();
      
      if (commandMap[cmd]) return true;
      
      return prefixCommands.some(prefix => cmd.startsWith(prefix + ' '));
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //                           COMMAND HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Maneja comandos que requieren argumentos
   */
  static async handleArgumentCommand(command, prefix, handler, usage, addOutput) {
    const argument = command.replace(prefix, '').trim();
    
    const validation = ValidationUtils.validateArgument(argument, 'argumento', usage);
    if (!validation.isValid) {
      addOutput(validation.errorMessage);
      return { success: false };
    }
    
    try {
      return await handler(argument);
    } catch (error) {
      addOutput(OutputUtils.formatError(`procesar comando ${prefix}`, error), 'error');
      return { success: false, error };
    }
  }

  /**
   * Maneja comandos de búsqueda
   */
  static async handleSearchCommand(command, prefix, searchFunction, itemType, addOutput) {
    const searchTerm = command.replace(prefix, '').trim();
    
    if (!searchTerm) {
      addOutput(`Error: Debe especificar un término de búsqueda.\nUso: ${prefix.toUpperCase()}[TEXTO]`);
      return { success: false };
    }

    try {
      addOutput(`Buscando ${itemType} que contengan: "${searchTerm}"`);
      const results = await searchFunction(searchTerm);
      
      if (!results || results.length === 0) {
        addOutput(`No se encontraron ${itemType} que coincidan con: "${searchTerm}"`);
        return { success: true };
      }

      return { success: true, data: results };
    } catch (error) {
      addOutput(OutputUtils.formatError(`buscar ${itemType}`, error), 'error');
      return { success: false, error };
    }
  }

  /**
   * Maneja navegación a rutas específicas
   */
  static handleNavigationCommand(path, navigate, addOutput, successMessage) {
    try {
      navigate(path);
      const message = successMessage || `Navegando a: ${path}`;
      addOutput(OutputUtils.formatSuccess(message));
      return { success: true };
    } catch (error) {
      addOutput(OutputUtils.formatError(`navegar a ${path}`, error), 'error');
      return { success: false, error };
    }
  }

  /**
   * Maneja operaciones de toggle (activar/desactivar)
   */
  static handleToggleCommand(setting, getCurrentState, toggleFunction, addOutput, messages) {
    try {
      
      const newState = toggleFunction();
      
      const message = newState 
        ? (messages.enabled || `${setting} activado`)
        : (messages.disabled || `${setting} desactivado`);
      
      addOutput(OutputUtils.formatSuccess(message));
      return { success: true, newState };
    } catch (error) {
      addOutput(OutputUtils.formatError(`cambiar estado de ${setting}`, error), 'error');
      return { success: false, error };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //                              LIST OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Maneja comandos de lista con formato estándar
   */
  static async handleListCommand(config) {
    const {
      loadFunction,
      formatItemFunction,
      itemType,
      title,
      emptyMessage,
      footerLines = [],
      addOutput
    } = config;

    try {
      addOutput(`Cargando lista de ${itemType}...`);
      const items = await loadFunction();
      
      if (!items || items.length === 0) {
        const message = emptyMessage || `No se encontraron ${itemType} disponibles.`;
        addOutput(message, 'warning');
        return { success: true, data: [] };
      }

      const formattedItems = items.map(formatItemFunction);
      const footer = [
        `Total: ${items.length} ${itemType}`,
        ...footerLines
      ];

      const listResult = OutputUtils.formatList(title, formattedItems, footer.join('\n'));
      addOutput(listResult);
      
      return { success: true, data: items };
    } catch (error) {
      addOutput(OutputUtils.formatError(`cargar lista de ${itemType}`, error), 'error');
      return { success: false, error };
    }
  }

  /**
   * Maneja comandos de selección interactiva
   */
  static async handleSelectionCommand(config) {
    const {
      loadFunction,
      createItemFunction,
      enterSelectionMode,
      title,
      onSelect,
      commandName,
      itemType,
      addOutput
    } = config;

    try {
      addOutput(`Cargando ${itemType} para selección...`);
      const items = await loadFunction();
      
      if (!items || items.length === 0) {
        addOutput(`No se encontraron ${itemType} disponibles.`, 'warning');
        return { success: true, data: [] };
      }

      const selectionItems = createItemFunction(items);
      
      enterSelectionMode(selectionItems, title, onSelect, commandName);

      return { success: true };
    } catch (error) {
      addOutput(OutputUtils.formatError(`cargar ${itemType} para selección`, error), 'error');
      return { success: false, error };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //                              HELP GENERATORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crea ayuda simple para comandos básicos
   */
  static createSimpleHelp(commandName, commandMap, descriptions, examples = []) {
    const commands = Object.keys(commandMap)
      .filter(cmd => cmd !== commandName)
      .map(cmd => ({
        command: cmd.toUpperCase(),
        description: descriptions[cmd] || 'Sin descripción'
      }));

    return OutputUtils.formatHelp(commandName, commands, examples);
  }

  /**
   * Crea ayuda compleja con múltiples secciones
   */
  static createComplexHelp(commandName, config) {
    const { sections, examples = [], footer } = config;
    
    let helpText = `Utilización: ${commandName.toUpperCase()} [SUBCOMANDO]\n\n`;

    sections.forEach(section => {
      if (section.title) {
        helpText += `${section.title}:\n`;
      }
      
      section.commands.forEach(cmd => {
        helpText += `${cmd.name.padEnd(20)} - ${cmd.desc}\n`;
      });
      
      helpText += '\n';
    });

    if (examples.length > 0) {
      helpText += 'Ejemplos:\n';
      examples.forEach(example => {
        helpText += `  ${example}\n`;
      });
      helpText += '\n';
    }

    if (footer) {
      helpText += footer;
    }

    return helpText.trim();
  }
}
