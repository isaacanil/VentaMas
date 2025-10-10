export const userRoles = [
    { id: 'admin', label: 'Admin', primaryColor: '#9750DD', secondaryColor: '#f5ebff' },
    { id: 'manager', label: 'Gerente', primaryColor: '#F31260', secondaryColor: '#ffe3ec' },
    { id: 'cashier', label: 'Cajero', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    // MIGRACIÓN: specialCashier1 y specialCashier2 ahora usan cashier base + permisos dinámicos
    // { id: 'specialCashier1', label: 'Cajero - Especial 1', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    // { id: 'specialCashier2', label: 'Cajero - Especial 2', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    { id: 'buyer', label: 'Comprador', primaryColor: '#17C964', secondaryColor: '#e3ffef' },
    { id: 'dev', label: 'Desarrollador', primaryColor: '#f312bb', secondaryColor: '#ffebfd' },
];




export const getRoleLabelById = (roleId) => {
    const role = userRoles.find(role => role.id === roleId);
    return role ? role.label : 'Rol no definido';
};

/**
 * Devuelve los roles disponibles para cambio temporal basándose en el role actual del usuario
 * @param {Object} user - El objeto usuario obtenido de useSelector(selectUser)
 * @returns {Array} - Array de roles disponibles para el usuario (misma estructura que userRoles)
 */
export const getAvailableRoles = (user) => {
    if (!user || !user.role) {
        return []; // Si no hay usuario o role, no devolver nada
    }

    const currentRole = user.role;

    switch (currentRole) {
        case 'dev':
            // Los desarrolladores pueden cambiar a cualquier role
            return userRoles.filter(role => role.id !== 'dev'); // Excluir el propio dev para evitar confusión

        case 'admin':
            // Los admins pueden cambiar a todos los roles excepto dev
            return userRoles.filter(role => role.id !== 'admin' && role.id !== 'dev');
            
        case 'manager':
            // Los gerentes pueden cambiar a roles de nivel inferior
            return userRoles.filter(role =>
                ['cashier', 'buyer'].includes(role.id)
            );

        case 'cashier':
            // Los cajeros solo pueden ver su propio rol (no pueden cambiar)
            return userRoles.filter(role => role.id === currentRole);

        case 'buyer':
            // Los compradores solo pueden ver su propio rol (no pueden cambiar)
            return userRoles.filter(role => role.id === currentRole);

        default:
            // Para roles no reconocidos, no permitir acceso
            return [];
    }
};

/**
 * Verifica si un usuario puede cambiar roles temporalmente
 * @param {Object} user - El objeto usuario obtenido de useSelector(selectUser)
 * @returns {boolean} - true si puede cambiar roles, false si no
 */
export const canChangeRoles = (user) => {
    if (!user || !user.role) {
        return false;
    }

    const availableRoles = getAvailableRoles(user);
    // Para cajeros y compradores que solo ven su propio rol, no pueden "cambiar"
    if (['cashier', 'buyer'].includes(user.role)) {
        return availableRoles.length > 0 && availableRoles[0].id !== user.role;
    }

    // Para otros roles, pueden cambiar si hay roles disponibles
    return availableRoles.length > 0;
};

/**
 * Devuelve los roles que el usuario puede asignar a otros usuarios (para formularios de administración)
 * @param {Object} user - El objeto usuario obtenido de useSelector(selectUser)
 * @returns {Array} - Array de roles que puede asignar (formato para Select de Ant Design)
 */
export const getAssignableRoles = (user) => {
    if (!user || !user.role) {
        return []; // Si no hay usuario o role, no devolver nada
    }

    const currentRole = user.role;
    let assignableRoles = [];

    switch (currentRole) {
        case 'dev':
            // Los desarrolladores pueden asignar cualquier role
            assignableRoles = userRoles.slice(); // Todos los roles
            break;

        case 'admin':
            // Los admins pueden asignar todos los roles excepto dev
            assignableRoles = userRoles.filter(role => role.id !== 'dev');
            break;
        case 'manager':
            // Los gerentes pueden asignar roles de nivel inferior
            assignableRoles = userRoles.filter(role =>
                ['cashier', 'buyer'].includes(role.id)
            );
            break;

        default:
            // Otros roles no pueden asignar roles a otros usuarios
            assignableRoles = [];
            break;
    }

    // Convertir al formato esperado por Ant Design Select
    return assignableRoles.map(role => ({
        value: role.id,
        label: role.label
    }));
};