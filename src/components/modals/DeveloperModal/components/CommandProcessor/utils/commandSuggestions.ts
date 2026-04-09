type CommandSuggestion = {
  command: string;
  description: string;
  requiresInput?: boolean;
};

export const getAllCommandSuggestions = (): CommandSuggestion[] => {
  const commands: CommandSuggestion[] = [
    // Comandos principales
    { command: 'HELP', description: 'Muestra ayuda de comandos' },
    { command: 'CLEAR', description: 'Borra la pantalla' },
    { command: 'CLS', description: 'Borra la pantalla' },
    { command: 'USER', description: 'Información del usuario' },
    { command: 'STATE', description: 'Estado del sistema' },
    { command: 'TEST', description: 'Navega a página de pruebas' },
    { command: 'PRUEBA', description: 'Navega a página de pruebas' },

    // Comandos BUSINESS
    { command: 'BUSINESS', description: 'Administra negocios' },
    { command: 'BUSINESS LIST', description: 'Lista todos los negocios' },
    {
      command: 'BUSINESS SELECT',
      description: 'Selección interactiva de negocios',
    },
    {
      command: 'BUSINESS SWITCH ',
      description: 'Cambia a otro negocio por ID',
      requiresInput: true,
    },
    { command: 'BUSINESS RETURN', description: 'Vuelve al negocio original' },
    {
      command: 'BUSINESS STATUS',
      description: 'Estado de conexión a negocios',
    },

    // Comandos ROLE
    { command: 'ROLE', description: 'Administra roles' },
    { command: 'ROLE LIST', description: 'Lista roles disponibles' },
    { command: 'ROLE SELECT', description: 'Selección interactiva de roles' },
    {
      command: 'ROLE SWITCH ',
      description: 'Cambia a otro role por ID',
      requiresInput: true,
    },
    { command: 'ROLE RETURN', description: 'Vuelve al role original' },
    { command: 'ROLE STATUS', description: 'Estado actual de roles' },

    // Comandos NAVIGATE
    { command: 'NAVIGATE', description: 'Navega entre rutas' },
    { command: 'NAVIGATE LIST', description: 'Lista todas las rutas' },
    {
      command: 'NAVIGATE SELECT',
      description: 'Selección interactiva de rutas',
    },
    {
      command: 'NAVIGATE SEARCH ',
      description: 'Busca rutas por texto',
      requiresInput: true,
    },
    { command: 'NAVIGATE /home', description: 'Navega a inicio' },
    { command: 'NAVIGATE /sales', description: 'Navega a ventas' },
    { command: 'NAVIGATE /inventory', description: 'Navega a inventario' },

    // Comandos SELECT
    { command: 'SELECT', description: 'Comandos de selección' },
    { command: 'SELECT HELP', description: 'Ayuda de selección' },
    { command: 'SELECT TEST', description: 'Prueba de selección' },
    { command: 'SELECT COLORS', description: 'Selecciona colores' },
    { command: 'SELECT NUMBERS', description: 'Selecciona números' },

    // Comandos DEBUG
    { command: 'DEBUG', description: 'Modo de depuración' },
    { command: 'DEBUG ON', description: 'Activa debug' },
    { command: 'DEBUG OFF', description: 'Desactiva debug' },

    // Comandos CASHBLOCK
    { command: 'CASHBLOCK', description: 'Bypass alerta de cuadre en ventas' },
    { command: 'CASHBLOCK ON', description: 'Activa bypass de cuadre' },
    { command: 'CASHBLOCK OFF', description: 'Desactiva bypass de cuadre' },
    {
      command: 'CASHBLOCK STATUS',
      description: 'Estado del bypass de cuadre',
    },

    // Comandos TESTMODE
    { command: 'TESTMODE', description: 'Modo de prueba facturación' },
    { command: 'TESTMODE ON', description: 'Activa modo prueba' },
    { command: 'TESTMODE OFF', description: 'Desactiva modo prueba' },
    { command: 'TESTMODE STATUS', description: 'Estado modo prueba' },
    // Comandos REACTSCAN
    { command: 'REACTSCAN', description: 'Carga React Scan' },

    // Comandos PRODUCT
    {
      command: 'PRODUCT',
      description: 'Comandos para buscar productos y ver sus IDs',
    },
    {
      command: 'PRODUCT ID ',
      description: 'Busca productos por nombre y muestra su ID',
      requiresInput: true,
    },

    // Comandos USER MANAGEMENT
    { command: 'USERS', description: 'Administra usuarios' },
    { command: 'USERS LIST', description: 'Lista todos los usuarios' },
    {
      command: 'USERS SELECT',
      description: 'Selección interactiva de usuarios',
    },
    {
      command: 'USERS SEARCH ',
      description: 'Busca usuarios por nombre/email',
      requiresInput: true,
    },
    {
      command: 'USERS PASSWORD',
      description: 'Cambiar contraseña de usuario',
    },
  ];

  return commands.map((cmd) => {
    const requiresInput =
      typeof cmd.requiresInput === 'boolean'
        ? cmd.requiresInput
        : cmd.command.endsWith(' ');

    return {
      ...cmd,
      requiresInput,
    };
  });
};

export const getCommandSuggestions = (input: string): CommandSuggestion[] => {
  if (!input || input.trim() === '') {
    return [];
  }

  const searchText = input.trim().toLowerCase();
  const allCommands = getAllCommandSuggestions();

  const suggestions = allCommands.filter((cmd) => {
    const command = cmd.command.toLowerCase();
    return command.startsWith(searchText) || command.includes(searchText);
  });

  suggestions.sort((a, b) => {
    const aCommand = a.command.toLowerCase();
    const bCommand = b.command.toLowerCase();
    const aStartsWith = aCommand.startsWith(searchText);
    const bStartsWith = bCommand.startsWith(searchText);

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return aCommand.localeCompare(bCommand);
  });

  // Limitar a 8 sugerencias para no saturar la UI
  return suggestions.slice(0, 8);
};
