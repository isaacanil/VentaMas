# Integración de Autorización con PIN

## Descripción General

El sistema de autorización con PIN permite a los usuarios autorizarse rápidamente usando un PIN de 6 dígitos numéricos en lugar de su contraseña completa. Esto es útil para operaciones que requieren autorización de un supervisor sin exponer la contraseña completa.

## Características

- **PINs de 6 dígitos**: Fáciles de memorizar y escribir
- **Expiración automática**: Los PINs expiran cada 24 horas por seguridad
- **Regeneración manual**: Los administradores pueden regenerar PINs en cualquier momento
- **Módulos específicos**: Los PINs se pueden habilitar para módulos específicos (Facturación, Cuentas por Cobrar)
- **Fallback a contraseña**: Siempre se puede usar la contraseña completa si el PIN no está disponible
- **Logs de auditoría**: Todas las autorizaciones con PIN quedan registradas

## Configuración de PINs

### Acceder a la Configuración

1. Ve a **Configuración** > **Configuración de Autorización**
2. Solo usuarios con rol `admin`, `owner` o `dev` pueden acceder

### Generar un PIN

1. En la lista de usuarios, haz clic en **Generar** o **Regenerar**
2. Selecciona los módulos habilitados:
   - **Facturación**: Para aprobar ediciones de facturas
   - **Cuentas por Cobrar**: Para autorizar operaciones en cuentas por cobrar
3. El PIN se mostrará una sola vez - guárdalo o imprímelo
4. El PIN expira automáticamente en 24 horas

### Desactivar un PIN

1. Haz clic en **Desactivar** junto al usuario
2. El PIN dejará de funcionar inmediatamente

## Integración en tu Módulo

### Opción 1: Usando el Hook (Recomendado)

```jsx
import { useAuthorizationPin } from '../hooks/useAuthorizationPin';
import { PinAuthorizationModal } from '../views/component/modals/PinAuthorizationModal/PinAuthorizationModal';

function MiComponente() {
  const { showModal, modalProps } = useAuthorizationPin({
    onAuthorized: (authorizer) => {
      // El usuario fue autorizado con PIN
      console.log('Autorizado por:', authorizer.name);
      // Ejecuta tu lógica aquí
      performSensitiveOperation(authorizer);
    },
    module: 'accountsReceivable', // o 'invoices'
    description: 'Se requiere autorización para modificar el monto.',
    allowedRoles: ['admin', 'owner', 'manager'],
    reasonList: [
      'Monto superior al límite permitido',
      'Cliente tiene deuda vencida',
    ],
  });

  const handleDeleteAccount = () => {
    // Mostrar modal de autorización antes de realizar la operación
    showModal();
  };

  return (
    <>
      <Button danger onClick={handleDeleteAccount}>
        Anular Cuenta
      </Button>

      <PinAuthorizationModal {...modalProps} />
    </>
  );
}
```

### Registro de Auditoría

Cada autorización debe dejar trazabilidad en Firestore. Utiliza el helper
`fbRecordAuthorizationApproval` para guardar quién autorizó, qué autorizó y a quién se le
autorizó.

```jsx
import { fbRecordAuthorizationApproval } from '../firebase/authorization/approvalLogs';

const { showModal, modalProps } = useAuthorizationPin({
  onAuthorized: async (authorizer) => {
    await fbRecordAuthorizationApproval({
      businessId: currentUser.businessID,
      module: 'invoices',
      action: 'invoice-discount-override',
      description: 'Autorización para aplicar descuento',
      requestedBy: currentUser,
      authorizer,
      targetUser: currentUser,
      target: { type: 'cart', id: cartId },
      metadata: { total, discountPercent },
    });

    performSensitiveOperation(authorizer);
  },
  module: 'invoices',
});
```

### Opción 2: Usando el Modal Directamente

```jsx
import { useState } from 'react';
import { PinAuthorizationModal } from '../views/component/modals/PinAuthorizationModal/PinAuthorizationModal';

function MiComponente() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAuthorized = (authorizer) => {
    console.log('Autorizado por:', authorizer.name);
    performSensitiveOperation(authorizer);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Anular Cuenta</Button>

      <PinAuthorizationModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onAuthorized={handleAuthorized}
        module="accountsReceivable"
        description="Se requiere autorización para anular esta cuenta."
        allowedRoles={['admin', 'owner']}
      />
    </>
  );
}
```

### Visualización del Historial

Los administradores pueden revisar todo el historial desde **Autorizaciones → Historial de
Autorizaciones**. Esta pestaña toma los registros guardados en la colección
`approvalLogs` y permite filtrar por módulo, buscar por nombre y refrescar los eventos más
recientes. Las acciones asociadas a facturación se registran automáticamente cuando la factura
termina de generarse, de modo que el número de comprobante queda enlazado al evento.

## Ejemplo: Integración en Cuentas por Cobrar

```jsx
// En AccountReceivableInfo.jsx

import { useState } from 'react';
import { Button, message } from 'antd';
import { useAuthorizationPin } from '../../../hooks/useAuthorizationPin';
import { PinAuthorizationModal } from '../../../views/component/modals/PinAuthorizationModal/PinAuthorizationModal';
import { fbCancelAccountReceivable } from '../../../firebase/accountsReceivable/...';

export const AccountReceivableActions = ({ account }) => {
  const [loading, setLoading] = useState(false);

  const { showModal: showPinModal, modalProps } = useAuthorizationPin({
    onAuthorized: async (authorizer) => {
      // Usuario autorizado, proceder con la cancelación
      await performCancellation(authorizer);
    },
    module: 'accountsReceivable',
    description:
      'Se requiere autorización de un supervisor para anular esta cuenta.',
    allowedRoles: ['admin', 'owner', 'manager'],
    reasonList: ['Cuenta con balance pendiente', 'Operación irreversible'],
  });

  const performCancellation = async (authorizer) => {
    try {
      setLoading(true);
      await fbCancelAccountReceivable(account.id, authorizer);
      message.success('Cuenta anulada exitosamente');
    } catch (error) {
      message.error(error?.message || 'Error anulando cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAccount = () => {
    // Verificar si se requiere autorización
    if (account.balance > 0) {
      // Requiere autorización
      showPinModal();
    } else {
      // No requiere autorización, proceder directamente
      performCancellation(null);
    }
  };

  return (
    <>
      <Button danger onClick={handleCancelAccount} loading={loading}>
        Anular Cuenta
      </Button>

      <PinAuthorizationModal {...modalProps} />
    </>
  );
};
```

## Props del Modal

### PinAuthorizationModal

| Prop                    | Tipo       | Requerido | Default                         | Descripción                                                                              |
| ----------------------- | ---------- | --------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| `isOpen`                | `boolean`  | Sí        | -                               | Controla la visibilidad del modal                                                        |
| `setIsOpen`             | `function` | Sí        | -                               | Función para cambiar la visibilidad                                                      |
| `onAuthorized`          | `function` | Sí        | -                               | Callback cuando la autorización es exitosa. Recibe el usuario autorizador como parámetro |
| `module`                | `string`   | No        | `'invoices'`                    | Módulo a autorizar: `'invoices'` o `'accountsReceivable'`                                |
| `description`           | `string`   | No        | `'Se requiere autorización...'` | Descripción de por qué se requiere autorización                                          |
| `allowedRoles`          | `array`    | No        | `['admin','owner','dev']`       | Roles permitidos para autorizar                                                          |
| `reasonList`            | `array`    | No        | `[]`                            | Lista de razones específicas para mostrar al usuario                                     |
| `allowPasswordFallback` | `boolean`  | No        | `true`                          | Permitir usar contraseña si no hay PIN                                                   |

## Hook useAuthorizationPin

### Parámetros

Recibe un objeto de configuración con las mismas props que el modal (excepto `isOpen` y `setIsOpen`).

### Retorno

```typescript
{
  showModal: () => void,      // Función para mostrar el modal
  hideModal: () => void,      // Función para ocultar el modal
  isModalOpen: boolean,       // Estado del modal
  modalProps: object          // Props para pasar al modal
}
```

## Servicios Firebase

### Generar PIN

```javascript
import { fbGenerateUserPin } from '../firebase/authorization/pinAuth';

const result = await fbGenerateUserPin(currentUser, targetUserId, [
  'invoices',
  'accountsReceivable',
]);

console.log('PIN generado:', result.pin);
console.log('Expira:', result.expiresAt);
```

### Validar PIN

```javascript
import { fbValidateUserPin } from '../firebase/authorization/pinAuth';

const result = await fbValidateUserPin(
  currentUser,
  'nombre_usuario',
  '123456',
  'accountsReceivable',
);

if (result.valid) {
  console.log('Usuario autorizado:', result.user);
} else {
  console.log('Error:', result.reason);
}
```

### Obtener Estado de PIN

```javascript
import { fbGetUserPinStatus } from '../firebase/authorization/pinAuth';

const status = await fbGetUserPinStatus(currentUser, targetUserId);

console.log('Tiene PIN:', status.hasPin);
console.log('Está activo:', status.isActive);
console.log('Expira:', status.expiresAt);
```

## Logs de Auditoría

Todas las operaciones con PINs quedan registradas automáticamente en:

```
businesses/{businessID}/pinAuthLogs/{logId}
```

Esto incluye:

- Generación de PINs
- Validaciones exitosas
- Intentos fallidos
- Desactivaciones

Los logs se pueden consultar con:

```javascript
import { fbGetPinAuthLogs } from '../firebase/authorization/pinAuth';

const logs = await fbGetPinAuthLogs(currentUser, { limit: 100 });
```

## Flujos de Autorización

### Flujo 1: Autorización Inmediata (PIN)

```
Usuario intenta operación
    ↓
Mostrar PinAuthorizationModal
    ↓
Usuario ingresa username + PIN
    ↓
Validar PIN (cliente + servidor)
    ↓
Si válido: ejecutar operación
Si inválido: mostrar error
```

### Flujo 2: Solicitud/Aprobación (Facturas)

```
Cajero intenta editar factura >24h
    ↓
Mostrar RequestInvoiceEditAuthorization
    ↓
Cajero envía solicitud
    ↓
Admin recibe notificación
    ↓
Admin abre InvoiceEditAuthorizations
    ↓
Admin hace clic en "Aprobar"
    ↓
Mostrar PinAuthorizationModal
    ↓
Admin ingresa su PIN
    ↓
Solicitud aprobada
    ↓
Cajero puede editar factura
```

## Seguridad

- ✅ PINs hasheados con bcrypt (misma seguridad que contraseñas)
- ✅ Expiración automática cada 24 horas
- ✅ Validación server-side en backend
- ✅ Logs de auditoría completos
- ✅ Rate limiting para prevenir fuerza bruta
- ✅ Verificación de roles y permisos
- ✅ Módulos específicos por PIN

## Mejores Prácticas

1. **Usa el hook**: Simplifica la integración y manejo de estado
2. **Define roles apropiados**: No todos los roles deben poder autorizar
3. **Proporciona razones claras**: Ayuda al usuario a entender por qué se requiere autorización
4. **Maneja errores**: Siempre muestra mensajes claros al usuario
5. **Regenera PINs regularmente**: Aunque expiran automáticamente, considera regenerar en caso de sospecha
6. **Revisa logs**: Monitorea los logs de auditoría para detectar actividad sospechosa

## Solución de Problemas

### El PIN no funciona

1. Verifica que no haya expirado (revisa en Configuración de Autorización)
2. Asegúrate de estar usando el nombre de usuario correcto
3. Verifica que el módulo esté habilitado para ese PIN
4. Regenera el PIN si es necesario

### Error "Usuario no autorizado"

- El rol del usuario no está en la lista `allowedRoles`
- Actualiza los roles permitidos o asigna un rol adecuado al usuario

### Error "Módulo no habilitado"

- El PIN no tiene habilitado el módulo que estás intentando usar
- Regenera el PIN con los módulos correctos

## Roadmap Futuro

- [ ] Notificaciones push cuando PIN está por expirar
- [ ] Configuración personalizada de tiempo de expiración
- [ ] Dashboard de estadísticas de uso de PINs
- [ ] Soporte para múltiples PINs por usuario
- [ ] Integración con autenticación biométrica
