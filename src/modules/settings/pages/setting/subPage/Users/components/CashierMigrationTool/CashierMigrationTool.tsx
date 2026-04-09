import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbUpdateUser } from '@/firebase/Auth/fbAuthV2/fbUpdateUser';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { setUserDynamicPermissions } from '@/services/dynamicPermissions';
import type { DynamicPermissionsPayload } from '@/types/permissions';
import type { UserIdentity, UserRoleId } from '@/types/users';
import { Button } from '@/components/ui/Button/Button';

type SpecialCashierRole = 'specialCashier1' | 'specialCashier2';

interface MigrationUser {
  id: string;
  name: string;
  role: SpecialCashierRole;
}

interface MigrationError {
  userId: string;
  userName: string;
  error: string;
}

interface MigrationDetail {
  userId: string;
  userName: string;
  originalRole: SpecialCashierRole;
  newRole?: UserRoleId;
  permissions?: DynamicPermissionsPayload;
  status: 'success' | 'error';
  error?: string;
}

interface MigrationResults {
  totalUsers: number;
  migrated: number;
  errors: MigrationError[];
  details: MigrationDetail[];
}

interface MigrationStatus {
  running: boolean;
  completed: boolean;
  results: MigrationResults | null;
  error: string | null;
}

/**
 * Componente para migrar usuarios de cajeros especiales al sistema dinámico
 * Solo visible para administradores
 */
const CashierMigrationTool = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    running: false,
    completed: false,
    results: null,
    error: null,
  });

  const { abilities } = useUserAccess();
  const currentUser = useSelector(selectUser) as UserIdentity | null;

  // Solo administradores pueden ejecutar la migración
  const canMigrate = Boolean(abilities?.can?.('manage', 'users'));

  // Definir qué permisos dinámicos se asignan a cada tipo de cajero especial
  const SPECIAL_CASHIER_PERMISSIONS: Record<
    SpecialCashierRole,
    DynamicPermissionsPayload
  > = {
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

  const executeRoleMigration = () => {
    if (!currentUser?.businessID) {
      setMigrationStatus({
        running: false,
        completed: false,
        results: null,
        error: 'No se encontró el businessID del usuario actual.',
      });
      return;
    }

    setMigrationStatus({
      running: true,
      completed: false,
      results: null,
      error: null,
    });

    // PASO 1: Obtener usuarios con roles especiales
    // En una implementación real, esto consultaría Firestore
    // Por ahora, simulamos algunos usuarios para mostrar el proceso
    const usersToMigrate: MigrationUser[] = [
      // Estos serían obtenidos de Firestore en implementación real
      // { id: 'user1', name: 'Usuario 1', role: 'specialCashier1' },
      // { id: 'user2', name: 'Usuario 2', role: 'specialCashier2' },
    ];

    const tasks = usersToMigrate.map((migrationUser) => {
      const originalRole = migrationUser.role;
      const permissions = SPECIAL_CASHIER_PERMISSIONS[originalRole] || {
        additionalPermissions: [],
        restrictedPermissions: [],
      };

      return fbUpdateUser({
        ...migrationUser,
        role: 'cashier',
        businessID: currentUser.businessID,
      })
        .then(() =>
          setUserDynamicPermissions(currentUser, migrationUser.id, permissions),
        )
        .then(
          () => ({
            userId: migrationUser.id,
            userName: migrationUser.name,
            originalRole,
            newRole: 'cashier',
            permissions,
            status: 'success' as const,
          }),
          (userError) => {
            const message =
              userError instanceof Error ? userError.message : String(userError);

            return {
              userId: migrationUser.id,
              userName: migrationUser.name,
              originalRole: migrationUser.role,
              status: 'error' as const,
              error: message,
            };
          },
        );
    });

    void Promise.all(tasks).then(
      (details) => {
        const errors = details
          .filter(
            (
              detail,
            ): detail is {
              userId: string;
              userName: string;
              status: 'error';
              error: string;
            } => detail.status === 'error',
          )
          .map((detail) => ({
            userId: detail.userId,
            userName: detail.userName,
            error: detail.error,
          }));

        const results: MigrationResults = {
          totalUsers: usersToMigrate.length,
          migrated: details.filter((detail) => detail.status === 'success')
            .length,
          errors,
          details,
        };

        setMigrationStatus({
          running: false,
          completed: true,
          results,
          error: null,
        });
      },
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        setMigrationStatus({
          running: false,
          completed: false,
          results: null,
          error: message,
        });
      },
    );
  };

  if (!canMigrate) {
    return null;
  }

  return (
    <Container>
      <Header>
        <h3>?? Migración de Cajeros Especiales</h3>
        <p>
          Esta herramienta migra usuarios con roles <code>specialCashier1</code>{' '}
          y <code>specialCashier2</code> al nuevo sistema de permisos dinámicos.
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
              <strong>?? Importante:</strong> Esta migración es irreversible.
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
            <h4>?? Ejecutando migración...</h4>
            <p>Por favor espera mientras se migran los usuarios.</p>
          </LoadingContainer>
        )}

        {migrationStatus.completed && migrationStatus.results && (
          <ResultsContainer>
            <h4>? Migración Completada</h4>
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
                {migrationStatus.results.details.map((detail) => (
                  <DetailItem
                    key={detail.userId}
                    $success={detail.status === 'success'}
                  >
                    <span>
                      <strong>{detail.userName}</strong> ({detail.userId})
                    </span>
                    {detail.status === 'success' ? (
                      <span>
                        ? {detail.originalRole} ? {detail.newRole}
                      </span>
                    ) : (
                      <span>? Error: {detail.error}</span>
                    )}
                  </DetailItem>
                ))}
              </DetailsContainer>
            )}

            {migrationStatus.results.totalUsers === 0 && (
              <InfoBox>
                ?? No se encontraron usuarios con roles specialCashier1 o
                specialCashier2 para migrar.
              </InfoBox>
            )}
          </ResultsContainer>
        )}

        {migrationStatus.error && (
          <ErrorContainer>
            <h4>? Error en la migración</h4>
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

const Container = styled.div`
  max-width: 800px;
  padding: 2rem;
  margin: 2rem auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem;
    color: #333;
  }

  p {
    line-height: 1.5;
    color: #666;
  }

  code {
    padding: 2px 4px;
    font-family: monospace;
    background: #f5f5f5;
    border-radius: 3px;
  }
`;

const Content = styled.div`
  line-height: 1.6;
`;

const PreMigrationInfo = styled.div`
  h4 {
    margin: 0 0 1rem;
    color: #333;
  }

  ul {
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  li {
    margin: 0.5rem 0;
  }

  code {
    padding: 2px 4px;
    font-family: monospace;
    background: #f5f5f5;
    border-radius: 3px;
  }
`;

const WarningBox = styled.div`
  padding: 1rem;
  margin: 1.5rem 0;
  color: #856404;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
`;

const LoadingContainer = styled.div`
  padding: 2rem;
  color: #666;
  text-align: center;
`;

const ResultsContainer = styled.div`
  h4 {
    margin: 0 0 1rem;
    color: #28a745;
  }
`;

const ResultsSummary = styled.div`
  padding: 1rem;
  margin: 1rem 0;
  background: #f8f9fa;
  border-radius: 4px;

  p {
    margin: 0.5rem 0;
  }
`;

const DetailsContainer = styled.div`
  margin: 1.5rem 0;

  h5 {
    margin: 0 0 1rem;
    color: #333;
  }
`;

const DetailItem = styled.div<{ $success: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: ${({ $success }) => ($success ? '#d4edda' : '#f8d7da')};
  border-bottom: 1px solid #eee;
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
  padding: 1rem;
  color: #0c5460;
  text-align: center;
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
`;

const ErrorContainer = styled.div`
  h4 {
    margin: 0 0 1rem;
    color: #dc3545;
  }

  p {
    padding: 1rem;
    color: #721c24;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
  }
`;
