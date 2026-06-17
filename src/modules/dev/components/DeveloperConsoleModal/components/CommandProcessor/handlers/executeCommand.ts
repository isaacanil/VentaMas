import { userRoles, getAvailableRoles } from '@/abilities/roles';
import {
  CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY,
  setCashRegisterAlertBypass,
  toggleMode,
} from '@/features/appModes/appModeSlice';
import {
  switchToBusiness,
  returnToOriginalBusiness,
  switchToRole,
  returnToOriginalRole,
} from '@/features/auth/userSlice';
import { fbSearchUsers } from '@/firebase/Auth/fbAuthV2/fbGetUsers';
import {
  getReactScanDevToolsConflictMessage,
  isReactDevToolsDetected,
} from '@/utils/reactScan';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import type { CommandProcessorInterface } from '../types';
import type { SelectionItem } from '../../../types';

type BusinessEntry = {
  id?: string;
  businessID?: string;
  business?: { name?: string };
};

type RoleEntry = {
  id: string;
  label: string;
};

type UserEntry = {
  user: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    businessID?: string;
  };
};

type ProductMatch = {
  id?: string;
  name?: string;
  brand?: string | { name?: string };
  code?: string;
  sku?: string;
  barcode?: string;
  internalCode?: string;
};

type BusinessSelectionItem = {
  id?: string;
  businessID?: string;
  business?: { name?: string };
  name?: string;
  originalName?: string;
  display?: string;
  isCurrent?: boolean;
  returnToOriginal?: boolean;
};

type UserSelectionItem = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  userData?: UserEntry['user'];
};

type RoleSelectionItem = {
  id?: string;
  label?: string;
  isOriginal?: boolean;
  isCurrent?: boolean;
};

const formatImpersonationExpiry = (expiresAtMs?: number | null): string => {
  if (!Number.isFinite(Number(expiresAtMs))) return 'No definido';
  return new Date(Number(expiresAtMs)).toLocaleString();
};

const isCashRegisterAlertBypassEnabled = (): boolean =>
  localStorage.getItem(CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY) === 'true';

const persistCashRegisterAlertBypass = (enabled: boolean): void => {
  if (enabled) {
    localStorage.setItem(CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY, 'true');
    return;
  }
  localStorage.removeItem(CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY);
};

export default async function executeCommand(
  this: CommandProcessorInterface,
  command: string,
) {
  // Add command echo first
  this.addCommandEcho(command);

  try {
    let result;
    const cmd = command.toLowerCase().trim();

    switch (true) {
      case cmd === 'clear':
      case cmd === 'cls':
        return { clearConsole: true };

      case cmd === 'select help':
        result = `Comandos de selección interactiva:

SELECT HELP       - Muestra esta ayuda
SELECT TEST       - Muestra una selección de prueba
SELECT COLORS     - Selecciona entre diferentes colores
SELECT NUMBERS    - Selecciona entre números del 1 al 10

Para seleccionar, haga clic en una opción y doble clic para confirmar.
Pulse ESC para cancelar.`;
        break;

      case cmd === 'select test': {
        const testItems = [
          { id: '1', display: 'Opción 1 - Esta es la primera opción' },
          { id: '2', display: 'Opción 2 - Esta es la segunda opción' },
          { id: '3', display: 'Opción 3 - Esta es la tercera opción' },
          { id: '4', display: 'Opción 4 - Esta es la cuarta opción' },
        ];

        this.enterSelectionMode(
          testItems,
          '🧪 Selección de prueba:',
          (item: SelectionItem) => {
            const selectedItem = item as {
              id?: string;
              label?: string;
              isOriginal?: boolean;
              isCurrent?: boolean;
            };
            if (!selectedItem || typeof selectedItem !== 'object') {
              this.addOutput(
                'No se pudo determinar la selección. Intente nuevamente.',
                'error',
              );
              return;
            }
            const _value =
              selectedItem &&
              typeof selectedItem === 'object' &&
              'value' in selectedItem
                ? (selectedItem as { value?: unknown }).value
                : selectedItem;
            const display =
              selectedItem &&
              typeof selectedItem === 'object' &&
              'display' in selectedItem
                ? String((selectedItem as { display?: unknown }).display ?? '')
                : String(selectedItem ?? '');
            this.addOutput(`Has seleccionado: ${display}`);
          },
          'select test',
        );
        break;
      }

      case cmd === 'select colors': {
        const colorItems = [
          { id: 'red', display: '🔴 Rojo', value: '#FF0000' },
          { id: 'green', display: '🟢 Verde', value: '#00FF00' },
          { id: 'blue', display: '🔵 Azul', value: '#0000FF' },
          { id: 'yellow', display: '🟡 Amarillo', value: '#FFFF00' },
          { id: 'purple', display: '🟣 Morado', value: '#800080' },
          { id: 'orange', display: '🟠 Naranja', value: '#FFA500' },
          { id: 'black', display: '⚫ Negro', value: '#000000' },
          { id: 'white', display: '⚪ Blanco', value: '#FFFFFF' },
        ];

        this.enterSelectionMode(
          colorItems,
          '🎨 Selección de Color:',
          (item: SelectionItem) => {
            const selectedItem = item as {
              id?: string;
              label?: string;
              isOriginal?: boolean;
              isCurrent?: boolean;
            };
            const display =
              selectedItem &&
              typeof selectedItem === 'object' &&
              'display' in selectedItem
                ? String((selectedItem as { display?: unknown }).display ?? '')
                : String(selectedItem ?? '');
            const value =
              selectedItem &&
              typeof selectedItem === 'object' &&
              'value' in selectedItem
                ? String((selectedItem as { value?: unknown }).value ?? '')
                : '';
            this.addOutput(
              `Has seleccionado: ${display}\nValor hexadecimal: ${value}`,
            );
          },
          'select colors',
        );
        break;
      }

      case cmd === 'select numbers': {
        const numberItems = Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          display: `Número ${i + 1}`,
          value: i + 1,
        }));

        this.enterSelectionMode(
          numberItems,
          '🔢 Selección de Número:',
          (selectedItem: SelectionItem) => {
            const value =
              selectedItem &&
              typeof selectedItem === 'object' &&
              'value' in selectedItem
                ? (selectedItem as { value?: unknown }).value
                : selectedItem;
            this.addOutput(
              `Has seleccionado el número: ${String(value ?? '')}`,
            );
          },
          'select numbers',
        );
        break;
      }

      case cmd === 'select':
        result = `Comando de selección interactiva.

Use uno de los siguientes comandos:
SELECT HELP       - Muestra ayuda detallada
SELECT TEST       - Prueba la selección interactiva
SELECT COLORS     - Selecciona entre diferentes colores
SELECT NUMBERS    - Selecciona entre números del 1 al 10

Para más información, use 'SELECT HELP'`;
        break;
      case cmd === 'help':
        result = `Para obtener más información sobre un comando específico, escriba HELP nombre-de-comando

BUSINESS       Administra la conexión a negocios (listar, cambiar, volver).
             Incluye modo de selección interactivo con clic.
CLEAR          Borra la pantalla.
CLS            Borra la pantalla.
DEBUG          Administra el modo de depuración.
CASHBLOCK      Ignora bloqueo de cuadre en ventas mientras esté activado.
HELP           Proporciona información de ayuda para los comandos.
NAVIGATE       Navega entre diferentes rutas de la aplicación.
             Incluye búsqueda y modo de selección interactivo.
PRUEBA         Navega rápidamente a la página de pruebas (/prueba).
REACTSCAN      Carga la herramienta React Scan.
PRODUCT         Busca productos por nombre y devuelve su ID.
PRODUCT ID      Devuelve el ID de un producto dado su nombre.
ROLE           Administra el cambio temporal de roles del usuario.
             Incluye modo de selección interactivo con clic.
SELECT         Comandos de selección interactiva con clic.
STATE          Muestra el estado actual de la aplicación.
TEST           Alias de PRUEBA - navega a la página de pruebas.
TESTMODE       Administra el modo de prueba de facturación.
USER           Muestra información del usuario actual.
USERS          Administra usuarios del sistema (listar, buscar, cambiar contraseña).
             ⚠️ Solo para desarrolladores. Incluye modo de selección interactivo.`;
        break;
      case cmd === 'user':
        result = `Información del usuario actual:

Nombre de usuario: ${this.user?.displayName || 'No disponible'}
Correo electrónico: ${this.user?.email || 'No disponible'}
Rol del sistema: ${this.user?.role || 'No asignado'}
Business ID actual: ${this.user?.businessID || 'No asignado'}
Modo temporal de negocio: ${this.isTemporaryMode ? 'ACTIVADO' : 'DESACTIVADO'}
Business ID original: ${this.originalBusinessId || 'N/A'}
Modo temporal de role: ${this.isTemporaryRoleMode ? 'ACTIVADO' : 'DESACTIVADO'}
Role original: ${this.originalRole || 'N/A'}
Estado: ${this.user ? 'Autenticado' : 'No autenticado'}`;
        break;
      case cmd === 'state':
        result = `Estado del sistema VentaMax:

Entorno de ejecución: ${import.meta.env.DEV ? 'Desarrollo' : 'Producción'}
Modo de depuración: ${localStorage.getItem('debugMode') ? 'ACTIVADO' : 'DESACTIVADO'}
Modo de prueba: ${this.isTestMode ? 'ACTIVADO' : 'DESACTIVADO'}
Bypass alerta cuadre ventas: ${isCashRegisterAlertBypassEnabled() ? 'ACTIVADO' : 'DESACTIVADO'}
Modo temporal de negocio: ${this.isTemporaryMode ? 'ACTIVADO' : 'DESACTIVADO'}
Modo temporal de role: ${this.isTemporaryRoleMode ? 'ACTIVADO' : 'DESACTIVADO'}
React Scan: ${this.reactScanLoaded ? 'CARGADO' : 'NO CARGADO'}
Usuario conectado: ${this.user?.displayName || 'Ninguno'}
Business ID actual: ${this.user?.businessID || 'No asignado'}
Role actual: ${this.user?.role || 'No asignado'}
Consola de desarrollador: ABIERTA`;
        break;

      case cmd === 'reactscan':
        if (import.meta.env.DEV) {
          if (isReactDevToolsDetected(window)) {
            result = getReactScanDevToolsConflictMessage();
          } else if (!this.reactScanLoaded) {
            result = 'Cargando React Scan...';
            // eslint_disable-next-line import/no-unresolved
            import('https://unpkg.com/react-scan/dist/auto.global.js')
              .then(() => {
                this.setReactScanLoaded(true);
                this.addOutput('React Scan se ha cargado correctamente.');
              })
              .catch(() =>
                this.addOutput(
                  'Error al cargar React Scan. Compruebe la conexión a Internet.',
                  'error',
                ),
              );
          } else {
            result = 'React Scan ya está cargado en esta sesión.';
          }
        } else {
          result =
            'React Scan solo está disponible en el entorno de desarrollo.';
        }
        break;

      case cmd.startsWith('product id '): {
        const rawCommand = command.trim();
        const searchTerm = rawCommand.slice('product id '.length).trim();

        if (!searchTerm) {
          result =
            'Especifica el nombre de un producto. Uso: PRODUCT ID [NOMBRE]';
          break;
        }

        result = `Buscando productos que coincidan con "${searchTerm}"...`;
        this.findProductsByName(searchTerm)
          .then((matches: ProductMatch[]) => {
            if (matches.length === 0) {
              this.addOutput(
                `No se encontró ningún producto que contenga "${searchTerm}".`,
                'warning',
              );
              return;
            }

            const maxMatchesToShow = 10;
            const limitedMatches = matches.slice(0, maxMatchesToShow);
            const header =
              matches.length > limitedMatches.length
                ? `Mostrando ${limitedMatches.length} de ${matches.length} coincidencias para "${searchTerm}":\n\n`
                : `Productos encontrados para "${searchTerm}":\n\n`;

            const formattedMatches = limitedMatches
              .map((product: ProductMatch, index: number) => {
                const brandName =
                  typeof product?.brand === 'string'
                    ? product.brand
                    : product?.brand?.name;
                const code =
                  product?.code ||
                  product?.sku ||
                  product?.barcode ||
                  product?.internalCode;
                const lines = [
                  `${index + 1}. ${product?.name || 'Sin nombre'}`,
                  `   ID: ${product?.id}`,
                ];

                if (brandName) lines.push(`   Marca: ${brandName}`);
                if (code) lines.push(`   Código: ${code}`);

                return lines.join('\n');
              })
              .join('\n\n');

            this.addOutput(`${header}${formattedMatches}`);
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.addOutput('Error al buscar productos: ' + message, 'error');
          });
        break;
      }

      case cmd === 'product':
        result = `Utilización: PRODUCT ID [NOMBRE]

Busca un producto por su nombre y devuelve el ID del documento en Firestore.
Ejemplo:
PRODUCT ID Coca-Cola`;
        break;

      case cmd === 'debug on':
        localStorage.setItem('debugMode', 'true');
        result = 'Modo de depuración ACTIVADO.';
        break;

      case cmd === 'debug off':
        localStorage.removeItem('debugMode');
        result = 'Modo de depuración DESACTIVADO.';
        break;

      case cmd === 'debug':
        result = `Utilización: DEBUG [ON | OFF]

ON     Activa el modo de depuración
OFF    Desactiva el modo de depuración

Estado actual: ${localStorage.getItem('debugMode') ? 'ACTIVADO' : 'DESACTIVADO'}`;
        break;

      case cmd === 'testmode on':
        if (!this.isTestMode) {
          this.dispatch(toggleMode());
          result =
            '🧪 Modo de prueba ACTIVADO.\n\nLas facturas se procesarán en modo de prueba sin afectar la base de datos.';
        } else {
          result = 'El modo de prueba ya está activo.';
        }
        break;

      case cmd === 'testmode off':
        if (this.isTestMode) {
          this.dispatch(toggleMode());
          result =
            '✅ Modo de prueba DESACTIVADO.\n\nLas facturas volverán a guardarse en la base de datos.';
        } else {
          result = 'El modo de prueba ya está desactivado.';
        }
        break;

      case cmd === 'testmode status':
        result = `Estado del modo de prueba: ${this.isTestMode ? '🧪 ACTIVADO' : '✅ DESACTIVADO'}

${
  this.isTestMode
    ? 'Las facturas se procesan en modo de prueba sin afectar la base de datos.'
    : 'Las facturas se guardan normalmente en la base de datos.'
}`;
        break;

      case cmd === 'testmode':
        result = `Utilización: TESTMODE [ON | OFF | STATUS]

ON       Activa el modo de prueba de facturación
OFF      Desactiva el modo de prueba de facturación  
STATUS   Muestra el estado actual del modo de prueba

Estado actual: ${this.isTestMode ? '🧪 ACTIVADO' : '✅ DESACTIVADO'}`;
        break;

      case cmd === 'cashblock on':
      case cmd === 'cashalert on':
        persistCashRegisterAlertBypass(true);
        this.dispatch(setCashRegisterAlertBypass(true));
        result = `🧪 Bypass de cuadre ACTIVADO.

Se ignorará el bloqueo visual de cuadre en Ventas mientras esté activo.`;
        break;

      case cmd === 'cashblock off':
      case cmd === 'cashalert off':
        persistCashRegisterAlertBypass(false);
        this.dispatch(setCashRegisterAlertBypass(false));
        result = `✅ Bypass de cuadre DESACTIVADO.

Se restauró el bloqueo normal de cuadre en Ventas.`;
        break;

      case cmd === 'cashblock status':
      case cmd === 'cashalert status': {
        const isEnabled = isCashRegisterAlertBypassEnabled();
        result = `Estado bypass de cuadre en ventas: ${isEnabled ? '🧪 ACTIVADO' : '✅ DESACTIVADO'}

${
  isEnabled
    ? 'El bloqueo visual de cuadre está deshabilitado en Ventas.'
    : 'El bloqueo visual de cuadre está funcionando normalmente.'
}
Modo prueba actual: ${this.isTestMode ? 'ACTIVADO' : 'DESACTIVADO'}`;
        break;
      }

      case cmd === 'cashblock':
      case cmd === 'cashalert':
        result = `Utilización: CASHBLOCK [ON | OFF | STATUS]

ON       Ignora el bloqueo visual de cuadre en Ventas
OFF      Restaura el bloqueo normal de cuadre
STATUS   Muestra el estado actual del bypass

Alias: CASHALERT [ON | OFF | STATUS]
Estado actual: ${isCashRegisterAlertBypassEnabled() ? '🧪 ACTIVADO' : '✅ DESACTIVADO'}`;
        break;

      case cmd === 'business list':
        result = 'Cargando lista de negocios...';
        // Cargar negocios de forma asíncrona (usar caché si ya se cargaron)
        (this.businesses.length > 0
          ? Promise.resolve(this.businesses)
          : this.loadBusinessesList())
          .then((businessesList: BusinessEntry[]) => {
            if (businessesList.length === 0) {
              this.addOutput(
                'No se encontraron negocios disponibles.',
                'error',
              );
            } else {
              const businessListResult = `Lista de negocios disponibles:\n\n${businessesList
                .map((business: BusinessEntry) => {
                  const businessId = business.id || business.businessID;
                  return `${business.business?.name || 'Sin nombre'} - ID: ${businessId}`;
                })
                .join(
                  '\n',
                )}\n\nPara cambiar de negocio use: BUSINESS SWITCH [ID]\nPara modo interactivo use: BUSINESS SELECT`;
              this.addOutput(businessListResult);
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.addOutput(
              'Error al cargar la lista de negocios: ' + message,
              'error',
            );
          });
        break;

      case cmd === 'business select':
        result = 'Cargando lista de negocios para selección...';
        // Cargar negocios y entrar en modo de selección (usar caché si ya se cargaron)
        (this.businesses.length > 0
          ? Promise.resolve(this.businesses)
          : this.loadBusinessesList())
          .then((businessesList: BusinessEntry[]) => {
            if (businessesList.length === 0) {
              this.addOutput(
                'No se encontraron negocios disponibles.',
                'error',
              );
            } else {
              // Preparar items para el modo de selección
              let selectionItems: any[] = businessesList.map(
                (business: BusinessEntry) => {
                  const businessId = business.id || business.businessID;
                  const businessName = business.business?.name || 'Sin nombre';
                  const isCurrent = businessId === this.user?.businessID;

                  return {
                    id: businessId,
                    display: `${businessName}${isCurrent ? ' (Actual)' : ''} - ID: ${businessId}`,
                    name: businessName,
                    businessData: business,
                    isCurrent: isCurrent,
                  };
                },
              );

              if (this.isTemporaryMode && this.originalBusinessId) {
                const originalBusinessData = businessesList.find(
                  (business: BusinessEntry) =>
                    (business.id || business.businessID) ===
                    this.originalBusinessId,
                );
                const originalBusinessName =
                  originalBusinessData?.business?.name || 'Mi negocio original';

                selectionItems = [
                  {
                    id: '__return_to_original__',
                    display: `↩️ Volver a mi negocio (${originalBusinessName}) - ID: ${this.originalBusinessId}`,
                    name: 'Volver a mi negocio',
                    originalName: originalBusinessName,
                    returnToOriginal: true,
                  },
                  ...selectionItems,
                ];
              }

              // Entrar en modo de selección
              this.enterSelectionMode(
                selectionItems,
                '📋 Seleccionar Negocio:',
                async (item: SelectionItem) => {
                  const selectedItem = item as BusinessSelectionItem;
                  if (!selectedItem) {
                    this.addOutput(
                      'No se pudo determinar la selección. Intente nuevamente.',
                      'error',
                    );
                    return;
                  }

                  try {
                    const targetName =
                      selectedItem.name ||
                      selectedItem.originalName ||
                      'Sin nombre';

                    if (selectedItem.returnToOriginal) {
                      const stopResult = await this.stopBusinessImpersonation();
                      if (!stopResult?.restored) {
                        this.addOutput(
                          'No había una impersonación activa para detener.',
                          'warning',
                        );
                        return;
                      }
                      this.dispatch(returnToOriginalBusiness());
                      this.addOutput(
                        `🔄 Regresando al negocio original: ${targetName}\nID: ${stopResult.businessId || this.originalBusinessId}\n\n✅ MODO TEMPORAL DESACTIVADO`,
                      );
                      return;
                    }

                    if (
                      this.isTemporaryMode &&
                      this.originalBusinessId &&
                      selectedItem.id === this.originalBusinessId
                    ) {
                      const stopResult = await this.stopBusinessImpersonation();
                      if (!stopResult?.restored) {
                        this.addOutput(
                          'No había una impersonación activa para detener.',
                          'warning',
                        );
                        return;
                      }
                      this.dispatch(returnToOriginalBusiness());
                      this.addOutput(
                        `🔄 Regresando al negocio original: ${targetName}\nID: ${stopResult.businessId || selectedItem.id}\n\n✅ MODO TEMPORAL DESACTIVADO`,
                      );
                      return;
                    }

                    if (selectedItem.id === this.user?.businessID) {
                      this.addOutput(
                        `🔄 Ya está conectado al negocio: ${targetName}\nID: ${selectedItem.id}`,
                      );
                      return;
                    }

                    const targetBusinessId = String(selectedItem.id || '').trim();
                    if (!targetBusinessId) {
                      this.addOutput(
                        'No se pudo determinar el ID del negocio seleccionado.',
                        'error',
                      );
                      return;
                    }

                    const startResult = await this.startBusinessImpersonation({
                      targetBusinessId,
                    });
                    const effectiveBusinessId =
                      startResult.overrideBusinessId || targetBusinessId;
                    this.dispatch(switchToBusiness(effectiveBusinessId));
                    this.addOutput(
                      `✅ Cambiado al negocio: ${targetName}\nID: ${effectiveBusinessId}\nExpira: ${formatImpersonationExpiry(startResult.expiresAtMs)}\n\n⚠️  MODO TEMPORAL ACTIVADO\nPara volver al negocio original use: BUSINESS RETURN`,
                    );
                  } catch (error: unknown) {
                    const message =
                      error instanceof Error ? error.message : String(error);
                    this.addOutput(
                      `Error al cambiar contexto de negocio: ${message}`,
                      'error',
                    );
                  }
                },
                'business select',
              );
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.addOutput(
              'Error al cargar la lista de negocios: ' + message,
              'error',
            );
          });
        break;

      case cmd.startsWith('business switch '): {
        const queryValue = command
          .trim()
          .replace(/^business switch\s+/i, '')
          .trim();
        if (!queryValue) {
          result =
            'Error: Debe especificar un ID de negocio.\nUso: BUSINESS SWITCH [ID]';
        } else {
          result = 'Verificando negocio...';
          // Cargar negocios si no están disponibles, o usar los que ya tenemos
          const businessesToSearch =
            this.businesses.length > 0
              ? this.businesses
              : await this.loadBusinessesList();

          const targetBusiness = businessesToSearch.find(
            (b: BusinessEntry) =>
              (b.id || b.businessID) === queryValue ||
              b.business?.name
                ?.toLowerCase()
                .includes(queryValue.toLowerCase()),
          );

          if (!targetBusiness) {
            result = `Error: No se encontró el negocio con ID "${queryValue}".\nUse BUSINESS LIST para ver los negocios disponibles.`;
            break;
          }

          const canonicalBusinessId = String(
            targetBusiness.id || targetBusiness.businessID || '',
          ).trim();
          if (!canonicalBusinessId) {
            result = 'Error: El negocio encontrado no tiene un ID válido.';
            break;
          }

          if (canonicalBusinessId === this.user?.businessID) {
            result = 'Ya está conectado a ese negocio.';
            break;
          }

          const startResult = await this.startBusinessImpersonation({
            targetBusinessId: canonicalBusinessId,
          });
          const effectiveBusinessId =
            startResult.overrideBusinessId || canonicalBusinessId;

          this.dispatch(switchToBusiness(effectiveBusinessId));
          result = `✅ Cambiado al negocio: ${targetBusiness.business?.name || 'Sin nombre'}\nID: ${effectiveBusinessId}\nExpira: ${formatImpersonationExpiry(startResult.expiresAtMs)}\n\n⚠️  MODO TEMPORAL ACTIVADO\nPara volver al negocio original use: BUSINESS RETURN`;
        }
        break;
      }

      case cmd === 'business return': {
        const stopResult = await this.stopBusinessImpersonation();
        if (!stopResult?.restored) {
          result = 'No había una impersonación activa para detener.';
          break;
        }
        this.dispatch(returnToOriginalBusiness());
        result = `✅ Regresado al negocio original.\nID: ${stopResult.businessId || this.originalBusinessId || 'N/A'}\n\n✅ MODO TEMPORAL DESACTIVADO`;
        break;
      }

      case cmd === 'business status': {
        const status = await this.getBusinessImpersonationStatus();
        const isActive = status.active === true;
        const currentBusinessId = status.currentBusinessId || this.user?.businessID;
        const originalBusinessId =
          status.originalBusinessId || this.originalBusinessId || 'N/A';
        const overrideBusinessId = status.overrideBusinessId || 'N/A';

        result = `Estado de conexión a negocios:

Negocio actual: ${currentBusinessId || 'No asignado'}
Modo temporal: ${isActive ? '⚠️  ACTIVADO' : '✅ DESACTIVADO'}
Negocio original: ${originalBusinessId}
Negocio temporal: ${overrideBusinessId}
Expira: ${formatImpersonationExpiry(status.expiresAtMs)}

${
  status.expired
    ? 'La impersonación expiró y el contexto fue restaurado automáticamente.'
    : isActive
      ? 'Está trabajando temporalmente en otro negocio.\nUse BUSINESS RETURN para volver al original.'
      : 'Está trabajando en su negocio original.'
}`;
        break;
      }
      case cmd === 'business':
        result = `Utilización: BUSINESS [LIST | SELECT | SWITCH | RETURN | STATUS]

LIST     Muestra todos los negocios disponibles
SELECT   Modo de selección interactivo con clic
SWITCH   Cambia temporalmente a otro negocio por ID
RETURN   Vuelve al negocio original
STATUS   Muestra el estado actual de conexión

Ejemplos:
BUSINESS LIST               - Lista simple
BUSINESS SELECT             - Selección interactiva
BUSINESS SWITCH abc123xyz   - Cambio directo por ID
BUSINESS RETURN             - Volver al original
BUSINESS STATUS             - Estado actual`;
        break;
      case cmd === 'role list': {
        const availableRolesForUser = getAvailableRoles(this.user);
        const rolesForDisplay = [...availableRolesForUser];

        if (this.isTemporaryRoleMode && this.originalRole) {
          const originalRoleData = userRoles.find(
            (r) => r.id === this.originalRole,
          );
          if (
            originalRoleData &&
            !rolesForDisplay.some(
              (role: RoleEntry) => role.id === originalRoleData.id,
            )
          ) {
            rolesForDisplay.unshift(originalRoleData);
          }
        }

        const availableRolesOutput = rolesForDisplay
          .map((role: RoleEntry) => {
            const parts = [role.label];
            if (
              normalizeRoleId(this.user?.role) === normalizeRoleId(role.id)
            ) {
              parts.push('(Actual)');
            }
            if (this.isTemporaryRoleMode && this.originalRole === role.id) {
              parts.push('(Rol original)');
            }
            return `${parts.join(' ')} - ID: ${role.id}`;
          })
          .join('\n');

        if (availableRolesOutput.length === 0) {
          result = 'No tiene roles disponibles para cambio temporal.';
        } else {
          result = `Lista de roles disponibles para su usuario:\n\n${availableRolesOutput}\n\nPara cambiar de role use: ROLE SWITCH [ID]\nPara modo interactivo use: ROLE SELECT`;
        }
        break;
      }
      case cmd === 'role select': {
        // Preparar items para el modo de selección usando roles disponibles para el usuario
        const userRolesForSelection = getAvailableRoles(this.user);
        const hasOriginalRoleOption =
          this.isTemporaryRoleMode && this.originalRole;

        if (userRolesForSelection.length === 0 && !hasOriginalRoleOption) {
          result = 'No tiene roles disponibles para cambio temporal.';
          break;
        }
        const roleSelectionItems = userRolesForSelection.map(
          (role: RoleEntry) => {
            const isCurrent =
              normalizeRoleId(role.id) === normalizeRoleId(this.user?.role);
            const isOriginal =
              hasOriginalRoleOption && this.originalRole === role.id;
            const labelParts = [role.label];

            if (isCurrent) {
              labelParts.push('(Actual)');
            }

            if (isOriginal) {
              labelParts.push('(Rol original)');
            }

            return {
              id: role.id,
              display: `${labelParts.join(' ')} - ID: ${role.id}`,
              label: role.label,
              roleData: role,
              isCurrent,
              isOriginal,
            };
          },
        );

        if (
          hasOriginalRoleOption &&
          !roleSelectionItems.some(
            (item: { id?: string }) => item.id === this.originalRole,
          )
        ) {
          const originalRoleData = userRoles.find(
            (r) => r.id === this.originalRole,
          );
          if (originalRoleData) {
            const isCurrent =
              normalizeRoleId(this.user?.role) ===
              normalizeRoleId(originalRoleData.id);
            const displayLabel = `${originalRoleData.label} (Rol original)${isCurrent ? ' (Actual)' : ''} - ID: ${originalRoleData.id}`;

            roleSelectionItems.unshift({
              id: originalRoleData.id,
              display: displayLabel,
              label: originalRoleData.label,
              roleData: originalRoleData,
              isCurrent,
              isOriginal: true,
            });
          }
        }

        // Entrar en modo de selección
        this.enterSelectionMode(
          roleSelectionItems,
          '👤 Seleccionar Role:',
          (item: SelectionItem) => {
            const selectedItem = item as RoleSelectionItem;
            // Callback cuando se selecciona un item
            if (!selectedItem) {
              this.addOutput(
                'No se pudo determinar la selección. Intente nuevamente.',
                'error',
              );
              return;
            }
            if (!selectedItem.id) {
              this.addOutput(
                'No se pudo determinar el role seleccionado. Intente nuevamente.',
                'error',
              );
              return;
            }
            if (selectedItem.isOriginal) {
              this.addOutput('🔄 Aplicando restauración de rol en backend...');
              this.switchCurrentUserRole(selectedItem.id)
                .then(() => {
                  this.dispatch(returnToOriginalRole());
                  this.addOutput(
                    `🔄 Regresando al role original: ${selectedItem.label}\nID: ${selectedItem.id}\n\n✅ MODO TEMPORAL DE ROLE DESACTIVADO`,
                  );
                })
                .catch((error: unknown) => {
                  const message =
                    error instanceof Error ? error.message : String(error);
                  this.addOutput(
                    `❌ Error al restaurar el rol original: ${message}`,
                    'error',
                  );
                });
            } else if (selectedItem.isCurrent) {
              // No está en modo temporal, solo mostrar mensaje
              this.addOutput(
                `🔄 Ya tiene asignado el role: ${selectedItem.label}\nID: ${selectedItem.id}`,
              );
            } else {
              this.addOutput('🔄 Aplicando cambio de rol en backend...');
              this.switchCurrentUserRole(selectedItem.id)
                .then(() => {
                  this.dispatch(switchToRole(selectedItem.id as string));
                  this.addOutput(
                    `✅ Cambiado al role: ${selectedItem.label}\nID: ${selectedItem.id}\n\n⚠️  MODO TEMPORAL DE ROLE ACTIVADO\nPara volver al role original use: ROLE RETURN`,
                  );
                })
                .catch((error: unknown) => {
                  const message =
                    error instanceof Error ? error.message : String(error);
                  this.addOutput(
                    `❌ Error al cambiar el rol: ${message}`,
                    'error',
                  );
                });
            }
          },
          'role select',
        );
        break;
      }
      case cmd.startsWith('role switch '): {
        const targetRoleId = cmd.replace('role switch ', '').trim();
        if (!targetRoleId) {
          result =
            'Error: Debe especificar un ID de role.\nUso: ROLE SWITCH [ID]';
        } else if (
          normalizeRoleId(targetRoleId) === normalizeRoleId(this.user?.role)
        ) {
          result = 'Ya tiene ese role asignado.';
        } else {
          // Verificar si el role está disponible para este usuario
          const userAvailableRolesForSwitch = getAvailableRoles(this.user);
          const targetRole = userAvailableRolesForSwitch.find(
            (r: RoleEntry) => r.id === targetRoleId,
          );
          const isOriginalTarget =
            this.isTemporaryRoleMode && this.originalRole === targetRoleId;

          if (targetRole) {
            result = '🔄 Aplicando cambio de rol en backend...';
            this.switchCurrentUserRole(targetRoleId)
              .then(() => {
                this.dispatch(switchToRole(targetRoleId));
                this.addOutput(
                  `✅ Cambiado al role: ${targetRole.label}\nID: ${targetRoleId}\n\n⚠️  MODO TEMPORAL DE ROLE ACTIVADO\nPara volver al role original use: ROLE RETURN`,
                );
              })
              .catch((error: unknown) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                this.addOutput(`❌ Error al cambiar el rol: ${message}`, 'error');
              });
          } else if (isOriginalTarget) {
            const originalRoleData = userRoles.find(
              (r: RoleEntry) => r.id === this.originalRole,
            );
            result = '🔄 Aplicando restauración de rol en backend...';
            this.switchCurrentUserRole(targetRoleId)
              .then(() => {
                this.dispatch(returnToOriginalRole());
                this.addOutput(
                  `🔄 Regresando al role original: ${originalRoleData?.label || 'Sin nombre'}\nID: ${this.originalRole}\n\n✅ MODO TEMPORAL DE ROLE DESACTIVADO`,
                );
              })
              .catch((error: unknown) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                this.addOutput(
                  `❌ Error al restaurar el rol original: ${message}`,
                  'error',
                );
              });
          } else {
            result = `Error: No tiene permisos para cambiar al role "${targetRoleId}" o el role no existe.\nUse ROLE LIST para ver los roles disponibles para su usuario.`;
          }
        }
        break;
      }

      case cmd === 'role return':
        if (!this.isTemporaryRoleMode) {
          result =
            'No está en modo temporal de role. Ya está usando su role original.';
        } else if (!this.originalRole) {
          result = 'No se pudo determinar el role original para restaurar.';
        } else {
          const originalRoleData = userRoles.find(
            (r) => r.id === this.originalRole,
          );
          result = '🔄 Aplicando restauración de rol en backend...';
          this.switchCurrentUserRole(this.originalRole)
            .then(() => {
              this.dispatch(returnToOriginalRole());
              this.addOutput(
                `✅ Regresado al role original: ${originalRoleData?.label || 'Sin nombre'}\nID: ${this.originalRole}\n\n✅ MODO TEMPORAL DE ROLE DESACTIVADO`,
              );
            })
            .catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : String(error);
              this.addOutput(
                `❌ Error al restaurar el rol original: ${message}`,
                'error',
              );
            });
        }
        break;

      case cmd === 'role status':
        result = `Estado de roles del usuario:

Role actual: ${this.user?.role || 'No asignado'}
Modo temporal de role: ${this.isTemporaryRoleMode ? '⚠️  ACTIVADO' : '✅ DESACTIVADO'}
Role original: ${this.originalRole || 'N/A'}

${
  this.isTemporaryRoleMode
    ? 'Está usando temporalmente otro role.\nUse ROLE RETURN para volver al original.'
    : 'Está usando su role original.'
}`;
        break;
      case cmd === 'role':
        result = `Utilización: ROLE [LIST | SELECT | SWITCH | RETURN | STATUS]

LIST     Muestra todos los roles disponibles
SELECT   Modo de selección interactivo con clic
SWITCH   Cambia temporalmente a otro role por ID
RETURN   Vuelve al role original
STATUS   Muestra el estado actual de roles

Ejemplos:
ROLE LIST               - Lista simple
ROLE SELECT             - Selección interactiva
ROLE SWITCH admin       - Cambio directo por ID
ROLE RETURN             - Volver al original
ROLE STATUS             - Estado actual`;
        break;

      // Comandos de usuarios
      case cmd === 'users list':
        result = 'Cargando lista de usuarios...';
        this.loadUsersList()
          .then((usersList: UserEntry[]) => {
            if (usersList.length === 0) {
              this.addOutput(
                'No se encontraron usuarios disponibles.',
                'error',
              );
            } else {
              const usersListResult = `Lista de usuarios disponibles:\n\n${usersList
                .map(
                  ({ user }: UserEntry, index: number) =>
                    `${index + 1}. ${user.name} (${user.email})\n   Role: ${user.role} | ID: ${user?.id}`,
                )
                .join(
                  '\n\n',
                )}\n\nTotal: ${usersList.length} usuarios\nPara cambiar contraseña use: USERS PASSWORD\nPara modo interactivo use: USERS SELECT`;
              this.addOutput(usersListResult);
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.addOutput(
              'Error al cargar la lista de usuarios: ' + message,
              'error',
            );
          });
        break;

      case cmd.startsWith('users search '): {
        const searchTerm = cmd.replace('users search ', '').trim();
        if (!searchTerm) {
          result =
            'Error: Debe especificar un término de búsqueda.\nUso: USERS SEARCH [TEXTO]';
        } else {
          result = 'Buscando usuarios...';
          fbSearchUsers(searchTerm)
            .then((users: any[]) => {
              const userEntries = users as UserEntry[];
              if (users.length === 0) {
                this.addOutput(
                  `No se encontraron usuarios que coincidan con "${searchTerm}".`,
                  'warning',
                );
              } else {
                const searchResult = `Usuarios encontrados para "${searchTerm}":\n\n${users
                  .map(
                    ({ user }: UserEntry, index: number) =>
                      `${index + 1}. ${user?.name} (${user?.email})\n   Role: ${user?.role} | ID: ${user?.id}`,
                  )
                  .join(
                    '\n\n',
                  )}\n\nEncontrados ${userEntries?.length} usuarios.`;
                this.addOutput(searchResult);
              }
            })
            .catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : String(error);
              this.addOutput('Error al buscar usuarios: ' + message, 'error');
            });
        }
        break;
      }

      case cmd === 'users password':
        result = 'Iniciando proceso de cambio de contraseña...';
        this.loadUsersList()
          .then((usersList: UserEntry[]) => {
            if (usersList.length === 0) {
              this.addOutput(
                'No se encontraron usuarios disponibles.',
                'error',
              );
            } else {
              // Preparar items para el modo de selección
              const selectionItems = usersList.map(({ user }: UserEntry) => ({
                id: user?.id,
                display: `👤 ${user?.name} Negocio: (${user?.businessID}) - Role: ${user?.role} - Id: ${user?.id}`,
                name: user?.name,
                email: user?.email,
                role: user?.role,
                userData: user,
              }));

              // Entrar en modo de selección
              this.enterSelectionMode(
                selectionItems,
                '🔑 Seleccionar Usuario para Cambiar Contraseña:',
                (item: SelectionItem) => {
                  const selectedItem = item as UserSelectionItem;
                  // Solicitar nueva contraseña
                  const newPassword = prompt(
                    `Ingrese la nueva contraseña para ${selectedItem.name}:`,
                  );

                  if (newPassword && newPassword.trim()) {
                    if (newPassword.length < 6) {
                      this.addOutput(
                        '❌ Error: La contraseña debe tener al menos 6 caracteres.',
                        'error',
                      );
                      return;
                    }

                    this.addOutput(
                      `🔄 Cambiando contraseña para ${selectedItem.name}...`,
                    );

                    this.changeUserPassword(
                      selectedItem.id as string,
                      newPassword.trim(),
                    )
                      .then(() => {
                        this.addOutput(
                          `✅ Contraseña cambiada exitosamente para:\n\nUsuario: ${selectedItem.name}\nEmail: ${selectedItem.email}\nID: ${selectedItem.id}\n\n🔐 La nueva contraseña ha sido encriptada y guardada.`,
                        );
                      })
                      .catch((error: unknown) => {
                        const message =
                          error instanceof Error
                            ? error.message
                            : String(error);
                        this.addOutput(
                          `❌ Error al cambiar la contraseña: ${message}`,
                          'error',
                        );
                      });
                  } else {
                    this.addOutput(
                      '❌ Operación cancelada. No se ingresó una contraseña válida.',
                      'warning',
                    );
                  }
                },
                'users password',
              );
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.addOutput(
              'Error al cargar la lista de usuarios: ' + message,
              'error',
            );
          });
        break;

      case cmd === 'users':
        result = `Utilización: USERS [LIST | SELECT | SEARCH | PASSWORD]

LIST                    Lista todos los usuarios disponibles
SELECT                  Modo de selección interactivo con clic
SEARCH [TEXTO]          Busca usuarios por nombre, email o ID
PASSWORD                Cambiar contraseña de un usuario (modo interactivo)

Ejemplos:
USERS LIST                    - Lista todos los usuarios
USERS SELECT                  - Selección interactiva
USERS SEARCH admin            - Busca usuarios que contengan "admin"
USERS PASSWORD                - Cambiar contraseña (selección interactiva)

⚠️ ATENCIÓN: El cambio de contraseñas es una operación sensible.
Solo usuarios con rol de desarrollador pueden usar estos comandos.`;
        break;

      default:
        result = `Comando no reconocido: "${command}"\nEscriba "HELP" para ver los comandos disponibles.`;
        break;
    }

    if (result) {
      this.addOutput(result);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Error al ejecutar comando:', error);
    this.addOutput(`Error: ${(error as Error).message}`, 'error');
    return { success: false, error };
  }
}
