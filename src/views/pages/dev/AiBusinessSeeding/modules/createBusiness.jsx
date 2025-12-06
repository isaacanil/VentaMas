import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faShop, faUser, faBolt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography, Button } from 'antd';
import { collection, query, where, getDocs } from 'firebase/firestore';
import React from 'react';

import { fbSignUp } from '../../../../../firebase/Auth/fbAuthV2/fbSignUp';
import { createBusiness } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import { db } from '../../../../../firebase/firebaseconfig';

const { Title, Text } = Typography;

export const createBusinessAction = {
  id: 'create_business',
  name: 'Registro de Negocio y Usuarios',
  description: 'Genera la estructura para un nuevo negocio y sus usuarios.',
  
  // Instrucción para el System Prompt de Gemini
  promptInstruction: `
    SI el usuario quiere crear un negocio o pide un ejemplo de uno:
    Retorna JSON con:
    {
      "action": "create_business",
      "data": {
          "business": { "name": "...", "rnc": "...", "address": "...", "tel": "...", "email": "...", "businessType": "general" },
          "users": [ { "realName": "...", "name": "...", "role": "admin"|"owner"|"manager"|"cashier"|"buyer", "password": "..." } ]
      }
    }
    Reglas Users: name (minúsculas, sin espacios), password (8+ chars, 1 Mayus, 1 Minus, 1 Num). Si no se indica rol, usar "admin".
  `,

  // Lógica de Ejecución
  execute: async (data, { addLog, isTestMode }) => {
    const { business, users } = data;
    const usersWithRole = (users || []).map((user) => ({
      ...user,
      role: user.role || 'admin',
    }));
    
    addLog(`🔍 Validando Negocio: "${business.name}"...`, 'info');
    
    if (!isTestMode) {
         const busQuery = query(collection(db, 'businesses'), where('business.name', '==', business.name));
         const busSnap = await getDocs(busQuery);
         if (!busSnap.empty) {
            addLog(`❌ Negocio duplicado`, 'error');
            throw new Error('El negocio ya existe.');
         }
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    for (const user of usersWithRole) {
        if (!passwordRegex.test(user.password)) {
            addLog(`❌ Pass débil: ${user.name}`, 'error');
            throw new Error(`Contraseña débil para ${user.name}`);
        }
    }

    let businessId;
    if (isTestMode) {
        await new Promise(r => setTimeout(r, 800));
        businessId = 'simulated_id_' + Math.random().toString(36).substr(2, 4);
        addLog(`✅ Negocio simulado ID: ${businessId}`, 'success');
    } else {
        businessId = await createBusiness(business);
        addLog(`✅ Negocio creado ID: ${businessId}`, 'success');
    }

    const updatedUsers = [];
    
    // Helper function for username resolution
    const checkUsernameAvailability = async (username) => {
        const q = query(collection(db, 'users'), where('user.name', '==', username));
        const snapshot = await getDocs(q);
        return snapshot.empty; 
    };

    const resolveUniqueUsername = async (baseUsername) => {
        let candidate = baseUsername;
        let counter = 1;
        while (!(await checkUsernameAvailability(candidate))) {
            addLog(`⚠️ Usuario '${candidate}' ocupado. Buscando alternativa...`, 'warning');
            const match = candidate.match(/(\d+)$/);
            if (match) {
                const num = parseInt(match[0], 10) + 1;
                candidate = candidate.replace(/(\d+)$/, num);
            } else {
                candidate = `${baseUsername}${counter < 10 ? '0' + counter : counter}`;
            }
            counter++;
        }
        return candidate;
    };

    for (const user of usersWithRole) {
        let finalUsername = user.name;
        if (!isTestMode) {
           finalUsername = await resolveUniqueUsername(finalUsername);
        }

        const userToCreate = { ...user, name: finalUsername };
        updatedUsers.push(userToCreate);

        if (isTestMode) {
          await new Promise(r => setTimeout(r, 400));
          addLog(`✅ Usuario simulado: ${userToCreate.name}`, 'success');
        } else {
          await fbSignUp({ ...userToCreate, businessID: businessId, active: true });
          addLog(`✅ Usuario creado: ${userToCreate.name}`, 'success');
        }
    }

    return { ...data, users: updatedUsers };
  },

  // Componente de Previsualización (Antes de ejecutar)
  PreviewComponent: ({ data, onExecute, loading, isTestMode }) => (
    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Confirmar Datos</Title>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', margin: '1rem 0', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 0', borderBottom: '1px solid #f5f5f5' }}>
                <FontAwesomeIcon icon={faShop} style={{ color: '#1890ff', fontSize: 18 }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>NEGOCIO</Text>
                    <Text strong>{data.business.name}</Text>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 0' }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#1890ff', fontSize: 18 }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>USUARIOS</Text>
                    <Text strong>{data.users.length} detectados</Text>
                </div>
            </div>
        </div>

        <Button 
            size="large"
            type="primary"
            icon={<FontAwesomeIcon icon={faBolt} />} 
            onClick={onExecute} 
            loading={loading}
            style={{ height: '50px', borderRadius: '25px', width: '100%', fontSize: '16px' }}
        >
            {isTestMode ? 'SIMULAR CREACIÓN' : 'CREAR NEGOCIO AHORA'}
        </Button>
    </div>
  ),

  // Componente de Resultado (Después de ejecutar)
  ResultComponent: ({ data, onReset }) => {

      const handleShareWhatsApp = () => {
        try {
          const business = data.business || {};
          const getRoleLabel = (role) => ({
            admin: 'Administrador',
            owner: 'Dueno',
            manager: 'Gerente',
            cashier: 'Caja',
            buyer: 'Compras'
          }[role] || role || 'Usuario');

          const formatLine = (label, value) => {
            const normalized = typeof value === 'string' ? value.trim() : value;
            return normalized ? `${label}: ${normalized}` : null;
          };

          const businessLines = [
            formatLine('Nombre', business.name),
            formatLine('Tipo', business.businessType),
            formatLine('RNC', business.rnc),
            formatLine('Telefono', business.tel),
            formatLine('Correo', business.email),
            formatLine('Direccion', business.address),
            'URL: https://ventamax.web.app'
          ].filter(Boolean).join('\n');

          const groupedUsers = (data.users || []).reduce((acc, user) => {
            const role = user.role || 'admin';
            const section = getRoleLabel(role);
            if (!acc[section]) acc[section] = [];
            acc[section].push({ ...user, role });
            return acc;
          }, {});

          let msg = 'ALBUSINESS SEEDING - Registro listo\n\n';
          msg += '*Datos del negocio*\n';
          msg += `${businessLines}\n\n`;
          msg += '*Usuarios creados*\n';

          Object.entries(groupedUsers).forEach(([section, users]) => {
            msg += `${section}:\n`;
            users.forEach((u) => {
              msg += `- Nombre completo: ${u.realName || 'Pendiente'}\n`;
              msg += `- Nombre de usuario: ${u.name || 'Pendiente'}\n`;
              msg += `- Contrasena: ${u.password || 'Pendiente'}\n`;
              msg += `- Rol: ${getRoleLabel(u.role)}\n\n`;
            });
          });

          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        } catch (e) { console.error(e); }
      };

      return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 80, height: 80, background: '#52c41a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '40px', color: 'white' }} />
            </div>
            <Title level={3} style={{ margin: 0 }}>Negocio Creado!</Title>
            <Text type="secondary">Las credenciales se han generado exitosamente.</Text>
            
            <Button 
              size="large"
              icon={<FontAwesomeIcon icon={faWhatsapp} />} 
              onClick={handleShareWhatsApp} 
              type="primary"
              style={{ height: '50px', borderRadius: '25px', backgroundColor: '#25D366', borderColor: '#25D366', marginTop: '1rem', padding: '0 3rem', fontSize: '16px' }}
            >
              Enviar por WhatsApp
            </Button>
            <Button type="link" onClick={onReset}>Crear otro</Button>
        </div>
      );
  }
};
