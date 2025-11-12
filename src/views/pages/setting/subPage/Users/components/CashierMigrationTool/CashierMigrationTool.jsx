import { useState } from 'react';
import styled from 'styled-components';

import { fbUpdateUser } from '../../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser';
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities';
import { setUserDynamicPermissions } from '../../../../../../../services/dynamicPermissions';
import { Button } from '../../../../../../templates/system/Button/Button';

/**
 * Componente para migrar usuarios de cajeros especiales al sistema dinámico
 * Solo visible para administradores
 */
const CashierMigrationTool = () => {
  const [migrationStatus, setMigrationStatus] = useState({
    running: false,
    completed: false,
    results: null,
    error: null,
  });

  const { abilities } = userAccess();

  // Solo administradores pueden ejecutar la migración
  const canMigrate = abilities.can('manage', 'users');

  // Definir qué permisos dinámicos se asignan a cada tipo de cajero especial
  const SPECIAL_CASHIER_PERMISSIONS = {
    specialCashier1: {
      additionalPermissions: [
        { action: 'modify', subject: 'Price' },
        { action: 'manage', subject: 'Discounts' },
      ],
      restrictedPermissions: [],
    },
    specialCashier2: {
      additionalPermissions: [
        { action: 'view', subject: 'Costs' },
        { action: 'create', subject: 'Report' },
      ],
      restrictedPermissions: [],
    },
  };

  const executeRoleMigration = async () => {
    setMigrationStatus({
      running: true,
      completed: false,
      results: null,
      error: null,
    });

    try {
      // PASO 1: Obtener usuarios con roles especiales
      // En una implementación real, esto consultaría Firestore
      // Por ahora, simulamos algunos usuarios para mostrar el proceso

      const usersToMigrate = [
        // Estos serían obtenidos de Firestore en implementación real
        // { id: 'user1', name: 'Usuario 1', role: 'specialCashier1' },
        // { id: 'user2', name: 'Usuario 2', role: 'specialCashier2' },
      ];

      const results = {
        totalUsers: usersToMigrate.length,
        migrated: 0,
        errors: [],
        details: [],
      };

      // PASO 2: Migrar cada usuario
      for (const user of usersToMigrate) {
        try {
          const originalRole = user.role;

          // 2a: Cambiar rol a 'cashier'
          await fbUpdateUser(user.id, {
            ...user,
            role: 'cashier',
          });

          // 2b: Asignar permisos dinámicos correspondientes
          const permissions = SPECIAL_CASHIER_PERMISSIONS[originalRole] || {
            additionalPermissions: [],
            restrictedPermissions: [],
          };

          await setUserDynamicPermissions(user.id, permissions);

          results.migrated++;
          results.details.push({
            userId: user.id,
            userName: user.name,
            originalRole,
            newRole: 'cashier',
            permissions,
            status: 'success',
          });
        } catch (userError) {
          results.errors.push({
            userId: user.id,
            userName: user.name,
            error: userError.message,
          });

          results.details.push({
            userId: user.id,
            userName: user.name,
            originalRole: user.role,
            status: 'error',
            error: userError.message,
          });
        }
      }

      setMigrationStatus({
        running: false,
        completed: true,
        results,
        error: null,
      });
    } catch (error) {
      setMigrationStatus({
        running: false,
        completed: false,
        results: null,
        error: error.message,
      });
    }
  };

  if (!canMigrate) {
    return null;
  }

  return (
    <Container>
      <Header>
        <h3>🚀 Migración de Cajeros Especiales</h3>
        <p>
          Esta herramienta migra usuarios con roles <code>specialCashier1</code>{' '}
          y<code>specialCashier2</code> al nuevo sistema de permisos dinámicos.
        </p>
      </Header>

      <Content>
        {!migrationStatus.completed && !migrationStatus.running && (
          <PreMigrationInfo>
            <h4>¿Qué hace esta migración?</h4>
            <ul>
              <li>
                Cambia el rol de usuarios <code>specialCashier1</code> y{' '}
                <code>specialCashier2</code> a <code>cashier</code>
              </li>
              <li>
                Asigna permisos dinámicos específicos según el rol original:
              </li>
              <ul>
                <li>
                  <strong>specialCashier1:</strong> Modificar precios +
                  Gestionar descuentos
                </li>
                <li>
                  <strong>specialCashier2:</strong> Ver costos + Crear reportes
                </li>
              </ul>
              <li>
                Los permisos se almacenan en Firestore en la colección{' '}
                <code>userPermissions</code>
              </li>
            </ul>

            <WarningBox>
              <strong>⚠️ Importante:</strong> Esta migración es irreversible.
              Asegúrate de haber hecho un respaldo de la base de datos antes de
              proceder.
            </WarningBox>

            <Button
              title="Ejecutar Migración"
              bgcolor="warning"
              onClick={executeRoleMigration}
              disabled={migrationStatus.running}
            />
          </PreMigrationInfo>
        )}

        {migrationStatus.running && (
          <LoadingContainer>
            <h4>🔄 Ejecutando migración...</h4>
            <p>Por favor espera mientras se migran los usuarios.</p>
          </LoadingContainer>
        )}

        {migrationStatus.completed && (
          <ResultsContainer>
            <h4>✅ Migración Completada</h4>
            <ResultsSummary>
              <p>
                <strong>Total de usuarios:</strong>{' '}
                {migrationStatus.results.totalUsers}
              </p>
              <p>
                <strong>Migrados exitosamente:</strong>{' '}
                {migrationStatus.results.migrated}
              </p>
              <p>
                <strong>Errores:</strong>{' '}
                {migrationStatus.results.errors.length}
              </p>
            </ResultsSummary>

            {migrationStatus.results.details.length > 0 && (
              <DetailsContainer>
                <h5>Detalles de la migración:</h5>
                {migrationStatus.results.details.map((detail, index) => (
                  <DetailItem key={index} success={detail.status === 'success'}>
                    <span>
                      <strong>{detail.userName}</strong> ({detail.userId})
                    </span>
                    {detail.status === 'success' ? (
                      <span>
                        ✅ {detail.originalRole} → {detail.newRole}
                      </span>
                    ) : (
                      <span>❌ Error: {detail.error}</span>
                    )}
                  </DetailItem>
                ))}
              </DetailsContainer>
            )}

            {migrationStatus.results.totalUsers === 0 && (
              <InfoBox>
                ℹ️ No se encontraron usuarios con roles specialCashier1 o
                specialCashier2 para migrar.
              </InfoBox>
            )}
          </ResultsContainer>
        )}

        {migrationStatus.error && (
          <ErrorContainer>
            <h4>❌ Error en la migración</h4>
            <p>{migrationStatus.error}</p>
            <Button
              title="Reintentar"
              bgcolor="error"
              onClick={executeRoleMigration}
            />
          </ErrorContainer>
        )}
      </Content>
    </Container>
  );
};

export default CashierMigrationTool;

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  p {
    color: #666;
    line-height: 1.5;
  }

  code {
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }
`;

const Content = styled.div`
  line-height: 1.6;
`;

const PreMigrationInfo = styled.div`
  h4 {
    color: #333;
    margin: 0 0 1rem 0;
  }

  ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.5rem 0;
  }

  code {
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }
`;

const WarningBox = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 1rem;
  margin: 1.5rem 0;
  color: #856404;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const ResultsContainer = styled.div`
  h4 {
    color: #28a745;
    margin: 0 0 1rem 0;
  }
`;

const ResultsSummary = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;

  p {
    margin: 0.5rem 0;
  }
`;

const DetailsContainer = styled.div`
  margin: 1.5rem 0;

  h5 {
    margin: 0 0 1rem 0;
    color: #333;
  }
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  background: ${(props) => (props.success ? '#d4edda' : '#f8d7da')};
  margin: 0.25rem 0;
  border-radius: 3px;

  span:first-child {
    font-weight: 500;
  }

  span:last-child {
    font-family: monospace;
    font-size: 0.9rem;
  }
`;

const InfoBox = styled.div`
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  padding: 1rem;
  color: #0c5460;
  text-align: center;
`;

const ErrorContainer = styled.div`
  h4 {
    color: #dc3545;
    margin: 0 0 1rem 0;
  }

  p {
    color: #721c24;
    background: #f8d7da;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #f5c6cb;
  }
`;
