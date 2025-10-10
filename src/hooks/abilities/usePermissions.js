import { PureAbility } from '@casl/ability';
import { useSelector } from 'react-redux';

import { selectAbilities, selectAbilitiesLoading } from '../../features/abilities/abilitiesSlice';

/**
 * Hook mejorado para usar permisos de usuario
 * Proporciona métodos más específicos y manejo de estados de carga
 */
export const usePermissions = () => {
    const rules = useSelector(selectAbilities);
    const loading = useSelector(selectAbilitiesLoading);
    
    const abilities = new PureAbility(rules || []);
    
    return {
        abilities,
        loading,
        
        // Métodos de conveniencia para casos comunes
        can: (action, subject, field) => abilities.can(action, subject, field),
        cannot: (action, subject, field) => abilities.cannot(action, subject, field),
        
        // Permisos específicos comunes
        canModifyPrices: () => abilities.can('modify', 'Price'),
        canViewPriceList: () => abilities.can('read', 'PriceList'),
        canManageUsers: () => abilities.can('manage', 'users'),
        canAccessAdminPanel: () => abilities.can('access', 'admin-panel'),
        canDeleteProducts: () => abilities.can('delete', 'Product'),
        canManageBusinessSettings: () => abilities.can('manage', 'business-settings'),
        
        // Método para verificar múltiples permisos
        hasAnyPermission: (permissions) => {
            return permissions.some(({ action, subject }) => abilities.can(action, subject));
        },
        
        // Método para verificar todos los permisos
        hasAllPermissions: (permissions) => {
            return permissions.every(({ action, subject }) => abilities.can(action, subject));
        }
    };
};

/**
 * HOC para componentes que requieren permisos específicos
 */
export const withPermissions = (requiredPermissions) => (Component) => {
    return (props) => {
        const { hasAllPermissions, loading } = usePermissions();
        
        if (loading) {
            return <div>Cargando permisos...</div>;
        }
        
        if (!hasAllPermissions(requiredPermissions)) {
            return <div>No tienes permisos para acceder a este componente.</div>;
        }
        
        return <Component {...props} />;
    };
};

// Ejemplo de uso:
// const ProtectedComponent = withPermissions([
//     { action: 'modify', subject: 'Price' },
//     { action: 'read', subject: 'PriceList' }
// ])(MyComponent);
