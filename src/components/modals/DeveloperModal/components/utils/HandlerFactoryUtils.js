/**
 * Utilidades de factoría para crear handlers de comandos de manera estandarizada
 */
export class HandlerFactoryUtils {
  /**
   * Valida la configuración de un handler
   * @param {Object} config - Configuración del handler
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.name - Nombre del handler
   * @param {Array} config.commands - Comandos soportados
   * @throws {Error} Si la configuración es inválida
   */
  static validateHandlerConfig(config) {
    const { context, name, commands } = config;

    if (!context) {
      throw new Error('El contexto del handler es requerido');
    }

    if (!name || typeof name !== 'string') {
      throw new Error('El nombre del handler debe ser una cadena válida');
    }

    if (commands && !Array.isArray(commands)) {
      throw new Error('Los comandos deben ser un array');
    }
  }

  /**
   * Crea un handler estándar con configuración básica
   * @param {Object} config - Configuración del handler
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.name - Nombre del handler
   * @param {Object} config.commandMap - Mapa de comandos
   * @param {Array} config.prefixCommands - Comandos con prefijos
   * @returns {Object} - Objeto con canHandle y execute configurados
   */
  static createStandardHandler(config) {
    const { context, name, commandMap = {}, prefixCommands = [] } = config;

    this.validateHandlerConfig(config);

    return {
      canHandle: context.createCanHandleChecker(commandMap, prefixCommands),
      execute: context.createCommandExecutor(commandMap, prefixCommands, name),
    };
  }

  /**
   * Crea un conjunto de handlers CRUD para una entidad
   * @param {Object} config - Configuración CRUD
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.entityName - Nombre de la entidad
   * @param {Object} config.service - Servicio para operaciones CRUD
   * @param {Function} config.formatter - Función para formatear items
   * @returns {Object} - Mapa de handlers CRUD
   */
  static createCrudHandlers(config) {
    const { context, entityName, service, formatter } = config;

    if (!entityName) {
      throw new Error('El nombre de la entidad es requerido');
    }

    if (!service) {
      throw new Error('El servicio CRUD es requerido');
    }

    const entityLower = entityName.toLowerCase();
    const entityPlural = `${entityLower}s`; // Simple pluralization

    return {
      [`list${entityName}`]: this.createListHandler({
        context,
        command: `list ${entityLower}`,
        loadFunction: () => service.getAll(),
        formatter:
          formatter || ((item) => item.name || item.id || String(item)),
        itemType: entityPlural,
      }),

      [`create${entityName}`]: this.createStandardHandler({
        context,
        name: `Create${entityName}Handler`,
        commandMap: {
          [`create ${entityLower}`]: async (command) => {
            // Implementation would depend on specific requirements
            return context.handleArgumentCommand(
              command,
              `create ${entityLower}`,
              (args) => service.create(args),
              `create ${entityLower} <datos>`,
            );
          },
        },
      }),

      [`update${entityName}`]: this.createStandardHandler({
        context,
        name: `Update${entityName}Handler`,
        commandMap: {
          [`update ${entityLower}`]: async (command) => {
            return context.handleArgumentCommand(
              command,
              `update ${entityLower}`,
              (args) => service.update(args),
              `update ${entityLower} <id> <datos>`,
            );
          },
        },
      }),

      [`delete${entityName}`]: this.createStandardHandler({
        context,
        name: `Delete${entityName}Handler`,
        commandMap: {
          [`delete ${entityLower}`]: async (command) => {
            return context.handleArgumentCommand(
              command,
              `delete ${entityLower}`,
              (args) => service.delete(args),
              `delete ${entityLower} <id>`,
            );
          },
        },
      }),
    };
  }

  /**
   * Crea un handler de lista optimizado
   * @param {Object} config - Configuración de lista
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.command - Comando de lista
   * @param {Function} config.loadFunction - Función para cargar datos
   * @param {Function} config.formatter - Función para formatear items
   * @param {string} config.itemType - Tipo de items
   * @param {string} config.title - Título de la lista
   * @returns {Function} - Handler de lista
   */
  static createListHandler(config) {
    const {
      context,
      loadFunction,
      formatter,
      itemType = 'elementos',
      title = null,
    } = config;

    return async () => {
      return context.handleListCommand({
        loadFunction,
        formatFunction:
          formatter || ((item) => item.name || item.id || String(item)),
        itemType,
        title: title || `Lista de ${itemType}`,
      });
    };
  }

  /**
   * Crea un handler de selección optimizado
   * @param {Object} config - Configuración de selección
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.command - Comando de selección
   * @param {Function} config.loadFunction - Función para cargar datos
   * @param {Function} config.onSelect - Función callback de selección
   * @param {string} config.itemType - Tipo de items
   * @returns {Function} - Handler de selección
   */
  static createSelectionHandler(config) {
    const { context, loadFunction, onSelect, itemType = 'elementos' } = config;

    return async () => {
      return context.handleSelectionCommand({
        loadFunction,
        onSelect,
        itemType,
        selectionTitle: `Seleccionar ${itemType}`,
      });
    };
  }

  /**
   * Crea un handler de búsqueda optimizado
   * @param {Object} config - Configuración de búsqueda
   * @param {Object} config.context - Contexto del handler base
   * @param {string} config.command - Comando de búsqueda
   * @param {Function} config.searchFunction - Función de búsqueda
   * @param {string} config.itemType - Tipo de items
   * @returns {Function} - Handler de búsqueda
   */
  static createSearchHandler(config) {
    const { context, command, searchFunction, itemType = 'elementos' } = config;

    return async (fullCommand) => {
      return context.handleSearchCommand(
        fullCommand,
        command,
        searchFunction,
        itemType,
      );
    };
  }

  /**
   * Crea un handler de ayuda optimizado
   * @param {Object} config - Configuración de ayuda
   * @param {Object} config.context - Contexto del handler base
   * @param {Array} config.commands - Lista de comandos disponibles
   * @param {string} config.handlerName - Nombre del handler
   * @param {string} config.description - Descripción del handler
   * @returns {Function} - Handler de ayuda
   */
  static createHelpHandler(config) {
    const {
      context,
      commands = [],
      handlerName = 'Handler',
      description = 'Handler de comandos',
    } = config;

    return async () => {
      const helpText = [
        `=== ${handlerName} ===`,
        description,
        '',
        'Comandos disponibles:',
      ];

      commands.forEach((cmd) => {
        if (typeof cmd === 'string') {
          helpText.push(`  ${cmd}`);
        } else if (cmd.command && cmd.description) {
          helpText.push(`  ${cmd.command} - ${cmd.description}`);
        }
      });

      context.addOutput(helpText.join('\n'));
      return { success: true };
    };
  }

  /**
   * Crea un handler de navegación optimizado
   * @param {Object} config - Configuración de navegación
   * @param {Object} config.context - Contexto del handler base
   * @param {Object} config.routes - Mapa de rutas
   * @returns {Function} - Handler de navegación
   */
  static createNavigationHandler(config) {
    const { context, routes = {} } = config;

    const commandMap = {};

    Object.entries(routes).forEach(([command, route]) => {
      commandMap[command] = () => {
        return context.handleNavigationCommand(
          route.path,
          route.successMessage || `Navegando a ${route.path}`,
        );
      };
    });

    return this.createStandardHandler({
      context,
      name: 'NavigationHandler',
      commandMap,
    });
  }

  /**
   * Crea un handler de toggle optimizado
   * @param {Object} config - Configuración de toggle
   * @param {Object} config.context - Contexto del handler base
   * @param {Object} config.toggles - Mapa de toggles
   * @returns {Function} - Handler de toggle
   */
  static createToggleHandler(config) {
    const { context, toggles = {} } = config;

    const commandMap = {};

    Object.entries(toggles).forEach(([command, toggleConfig]) => {
      commandMap[command] = () => {
        return context.handleToggleCommand(
          toggleConfig.setting,
          toggleConfig.getCurrentState,
          toggleConfig.toggleFunction,
          toggleConfig.messages || {},
        );
      };
    });

    return this.createStandardHandler({
      context,
      name: 'ToggleHandler',
      commandMap,
    });
  }
}

export default HandlerFactoryUtils;
