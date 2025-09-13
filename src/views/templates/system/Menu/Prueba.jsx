import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { userAccess } from '../../../../hooks/abilities/useAbilities';

// Pantalla de pruebas: restringida sólo a usuarios con role "dev"
export const Prueba = () => {
	const navigate = useNavigate();
	const { abilities, loading } = userAccess();

	useEffect(() => {
		// Cuando las abilities estén listas, validar acceso de developer
		if (!loading) {
			const canAccess = abilities?.can('developerAccess', 'all');
			if (!canAccess) {
				message.warning('No tienes permisos para acceder a esta página');
				navigate('/home', { replace: true, state: { unauthorized: true } });
			}
		}
	}, [abilities, loading, navigate]);

	// Evitar parpadeos mientras RequireAuth/abilities resuelven o durante la redirección
	if (loading) return null;
	if (!abilities?.can('developerAccess', 'all')) return null;

	return <div>Nada por aquí...</div>;
};

export default Prueba;
