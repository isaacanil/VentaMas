
export const userRoles = [
    { id: 'admin', label: 'Admin', primaryColor: '#9750DD', secondaryColor: '#f5ebff' },
    { id: 'manager', label: 'Gerente', primaryColor: '#F31260', secondaryColor: '#ffe3ec' },
    { id: 'cashier', label: 'Cajero', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    { id: 'specialCashier1', label: 'Cajero - Especial 1', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    { id: 'specialCashier2', label: 'Cajero - Especial 2', primaryColor: '#F5A524', secondaryColor: '#fff8ec' },
    { id: 'buyer', label: 'Comprador', primaryColor: '#17C964', secondaryColor: '#e3ffef' },
];

export const getRoleLabelById = (roleId) => {
    const role = userRoles.find(role => role.id === roleId);
    return role ? role.label : 'Rol no definido';
};