# Guía de Testing - Sistema de Autorización con PIN

## 🧪 Pruebas Manuales

### Pre-requisitos

- Usuario con rol `admin`, `owner` o `dev`
- Al menos 2 usuarios en el sistema (uno admin, uno cajero)
- Acceso a la aplicación corriendo

---

## 1. Testing de Configuración de PINs

### 1.1 Acceder a la Configuración

**Pasos:**

1. Iniciar sesión como admin
2. Ir a **Configuración** (⚙️)
3. Buscar y hacer clic en **"Configuración de Autorización"**

**Resultado esperado:**

- ✅ Pantalla muestra dashboard con estadísticas
- ✅ Tabla con todos los usuarios del negocio
- ✅ Columnas: Usuario, Rol, Estado PIN, Módulos, Expira, Acciones

---

### 1.2 Generar PIN para Usuario

**Pasos:**

1. En la lista de usuarios, buscar un usuario sin PIN
2. Hacer clic en botón **"Generar"**
3. En el modal:
   - Verificar que aparece el nombre del usuario
   - Seleccionar módulos: ☑️ Facturación, ☑️ Cuentas por Cobrar
4. Hacer clic en **"Generar"**

**Resultado esperado:**

- ✅ Modal se cierra
- ✅ Aparece modal con el PIN generado (6 dígitos)
- ✅ Se muestra información de expiración (24 horas)
- ✅ Botón "Copiar" funciona
- ✅ Botón "Imprimir" abre ventana de impresión

**Importante:** Anota el PIN y el nombre de usuario para pruebas siguientes

---

### 1.3 Verificar Estado de PIN

**Pasos:**

1. Cerrar modal de detalles
2. Buscar el usuario en la tabla

**Resultado esperado:**

- ✅ Estado cambió a "Activo" (tag verde 🟢)
- ✅ Módulos muestra "Facturación, Cuentas por Cobrar"
- ✅ Columna "Expira" muestra "~24h restantes"
- ✅ Estadísticas actualizadas (PINs Activos +1)

---

### 1.4 Regenerar PIN

**Pasos:**

1. Para el mismo usuario, hacer clic en **"Regenerar"**
2. Verificar advertencia amarilla sobre reemplazo
3. Cambiar selección de módulos (solo Facturación)
4. Hacer clic en **"Regenerar"**

**Resultado esperado:**

- ✅ Nuevo PIN generado (diferente al anterior)
- ✅ Módulos actualizados en la tabla
- ✅ PIN anterior ya no funciona

---

### 1.5 Desactivar PIN

**Pasos:**

1. Para el usuario con PIN, hacer clic en **"Desactivar"**
2. Confirmar en el diálogo

**Resultado esperado:**

- ✅ Estado cambia a "Inactivo" (tag rojo 🔴)
- ✅ Botón "Desactivar" desaparece
- ✅ Solo queda botón "Regenerar"

---

## 2. Testing de Autorización en Facturación

### 2.1 Aprobar Edición de Factura con PIN

**Setup:**

1. Tener una solicitud de edición de factura pendiente
   - Si no hay, crear una factura como cajero y esperar >24h (o modificar fecha manualmente en Firestore para testing)
2. Tener un usuario con PIN activo y módulo "Facturación" habilitado

**Pasos:**

1. Iniciar sesión como admin
2. Ir a **Autorizaciones** (en el menú)
3. Verificar que hay solicitudes pendientes
4. Hacer clic en **"Aprobar"** en una solicitud

**Resultado esperado:**

- ✅ Se abre `PinAuthorizationModal`
- ✅ Modal muestra descripción: "Se requiere autorización para aprobar la edición de factura"
- ✅ Campos: Usuario y PIN visible
- ✅ Link para alternar a contraseña visible

---

### 2.2 Autorizar con PIN Válido

**Pasos:**

1. Ingresar nombre de usuario (que tiene PIN)
2. Ingresar PIN de 6 dígitos
3. Hacer clic en **"Autorizar"**

**Resultado esperado:**

- ✅ Modal se cierra
- ✅ Mensaje: "Solicitud aprobada con PIN"
- ✅ Estado de solicitud cambia a "approved"
- ✅ Se registra en logs de auditoría

---

### 2.3 Autorizar con PIN Inválido

**Pasos:**

1. Abrir modal de autorización
2. Ingresar nombre de usuario correcto
3. Ingresar PIN incorrecto (ej: 000000)
4. Hacer clic en **"Autorizar"**

**Resultado esperado:**

- ✅ Mensaje de error: "PIN incorrecto"
- ✅ Modal permanece abierto
- ✅ Campos no se limpian
- ✅ Se registra intento fallido en logs

---

### 2.4 Autorizar con Usuario sin PIN

**Pasos:**

1. Abrir modal de autorización
2. Ingresar nombre de usuario sin PIN configurado
3. Ingresar cualquier PIN
4. Hacer clic en **"Autorizar"**

**Resultado esperado:**

- ✅ Mensaje: "Usuario no tiene PIN configurado"
- ✅ Modal permanece abierto

---

### 2.5 Fallback a Contraseña

**Pasos:**

1. Abrir modal de autorización
2. Hacer clic en link: "¿No tienes PIN? Usa tu contraseña →"
3. Ingresar usuario y contraseña completa
4. Hacer clic en **"Autorizar"**

**Resultado esperado:**

- ✅ Modal cambia a modo contraseña
- ✅ Campo PIN reemplazado por campo Contraseña
- ✅ Autorización funciona con contraseña
- ✅ Mensaje: "Solicitud aprobada"

---

## 3. Testing de Expiración

### 3.1 Simular Expiración (Desarrollo)

**Método 1: Firestore Manual**

1. Abrir Firestore Console
2. Navegar a `users/{userId}`
3. Editar campo `authorizationPin.expiresAt`
4. Cambiar a fecha pasada

**Método 2: Esperar 24 horas (Producción)**

- Generar PIN y esperar 24 horas

**Pasos de prueba:**

1. Intentar autorizar con el PIN expirado

**Resultado esperado:**

- ✅ Mensaje: "PIN expirado"
- ✅ En tabla de configuración aparece tag naranja "Expirado"
- ✅ Debe regenerarse el PIN

---

## 4. Testing de Roles y Permisos

### 4.1 Usuario No Admin Intenta Configurar PINs

**Pasos:**

1. Iniciar sesión como cajero (rol: `cashier`)
2. Intentar acceder a `/settings/authorization-config`

**Resultado esperado:**

- ✅ Muestra mensaje: "Acceso Denegado"
- ✅ No puede ver lista de usuarios
- ✅ No puede generar PINs

---

### 4.2 Usuario con Rol No Permitido Intenta Autorizar

**Pasos:**

1. Generar PIN para un cajero
2. En modal de autorización, intentar autorizar con credenciales de cajero

**Resultado esperado:**

- ✅ Mensaje: "Usuario no autorizado para aprobar esta acción"
- ✅ No se ejecuta la operación

---

## 5. Testing de Módulos

### 5.1 PIN sin Módulo Habilitado

**Setup:**

1. Generar PIN con solo módulo "Facturación" habilitado

**Pasos:**

1. Intentar usar el PIN para autorizar en Cuentas por Cobrar
   - (Necesitarás implementar integración en Cuentas por Cobrar primero)

**Resultado esperado:**

- ✅ Mensaje: "Módulo no habilitado para este usuario"
- ✅ PIN funciona en Facturación
- ✅ PIN NO funciona en Cuentas por Cobrar

---

## 6. Testing de UI/UX

### 6.1 Copiar PIN

**Pasos:**

1. Generar PIN
2. Hacer clic en botón "Copiar"

**Resultado esperado:**

- ✅ Texto del botón cambia a "¡Copiado!"
- ✅ PIN copiado al portapapeles
- ✅ Texto vuelve a "Copiar" después de 2 segundos

---

### 6.2 Imprimir PIN

**Pasos:**

1. Generar PIN
2. Hacer clic en botón "Imprimir"

**Resultado esperado:**

- ✅ Se abre ventana de impresión
- ✅ Documento contiene:
  - Título: "PIN de Autorización"
  - PIN en grande y centrado
  - Información del usuario
  - Módulos habilitados
  - Fecha de expiración
  - Advertencia de seguridad

---

### 6.3 Estadísticas en Dashboard

**Pasos:**

1. Generar PINs para varios usuarios
2. Desactivar algunos
3. Hacer expirar algunos (manualmente en Firestore)
4. Refrescar página de configuración

**Resultado esperado:**

- ✅ Total Usuarios: correcto
- ✅ Con PIN Configurado: correcto
- ✅ PINs Activos: solo cuenta activos no expirados
- ✅ PINs Expirados: cuenta solo expirados

---

## 7. Testing de Logs de Auditoría

### 7.1 Verificar Logs en Firestore

**Pasos:**

1. Realizar varias acciones:
   - Generar PIN
   - Validar PIN (exitoso)
   - Validar PIN (fallido)
   - Desactivar PIN
2. Abrir Firestore Console
3. Navegar a `businesses/{businessID}/pinAuthLogs`

**Resultado esperado:**

- ✅ Cada acción tiene un documento
- ✅ Documentos contienen:
  - action
  - timestamp
  - performedBy (uid, name, role)
  - targetUserId
  - module
  - reason (para fallos)

---

### 7.2 Consultar Logs Programáticamente

**Pasos (en consola del navegador):**

```javascript
import { fbGetPinAuthLogs } from '../firebase/authorization/pinAuth';

// En componente con acceso a user
const logs = await fbGetPinAuthLogs(user, { limit: 20 });
console.table(logs);
```

**Resultado esperado:**

- ✅ Retorna array de logs
- ✅ Ordenados por timestamp (más reciente primero)
- ✅ Limitados a 20 (o valor especificado)

---

## 8. Testing de Seguridad

### 8.1 PIN Hasheado

**Pasos:**

1. Generar PIN
2. Abrir Firestore Console
3. Ver documento del usuario
4. Inspeccionar campo `authorizationPin.pin`

**Resultado esperado:**

- ✅ PIN NO está en texto plano
- ✅ Es un hash bcrypt (empieza con `$2a$` o `$2b$`)
- ✅ Longitud del hash ~60 caracteres

---

### 8.2 Validación Server-Side

**Nota:** Si implementaste Cloud Functions

**Pasos:**

1. Intentar validar PIN manipulando request desde consola
2. Verificar que solo Cloud Function puede validar

**Resultado esperado:**

- ✅ No se puede validar desde cliente directo
- ✅ Validación pasa por backend

---

## 9. Testing de Edge Cases

### 9.1 PIN con Caracteres No Numéricos

**Pasos:**

1. En modal de autorización
2. Intentar ingresar letras: "abc123"

**Resultado esperado:**

- ✅ Input no acepta letras
- ✅ Solo permite dígitos 0-9
- ✅ Máximo 6 caracteres

---

### 9.2 Usuario sin Negocio (businessID)

**Pasos:**

1. Crear usuario sin businessID (en Firestore manualmente)
2. Intentar generar PIN para ese usuario

**Resultado esperado:**

- ✅ Error: "Falta businessID del usuario"
- ✅ No se genera PIN

---

### 9.3 Usuarios de Diferentes Negocios

**Pasos:**

1. Tener 2 usuarios de diferentes negocios
2. Admin del negocio A intenta generar PIN para usuario del negocio B

**Resultado esperado:**

- ✅ Error: "No tienes permisos para modificar este usuario"
- ✅ No se genera PIN

---

## 10. Testing de Integración

### 10.1 Ejemplo de Integración en Nuevo Módulo

**Crear componente de prueba:**

```jsx
// TestPinIntegration.jsx
import { useAuthorizationPin } from '../hooks/useAuthorizationPin';
import { PinAuthorizationModal } from '../views/component/modals/PinAuthorizationModal/PinAuthorizationModal';
import { Button } from 'antd';

export const TestPinIntegration = () => {
  const { showModal, modalProps } = useAuthorizationPin({
    onAuthorized: (authorizer) => {
      alert(`Autorizado por: ${authorizer.name}`);
      console.log('Authorizer:', authorizer);
    },
    module: 'accountsReceivable',
    description: 'Prueba de integración de PIN',
    allowedRoles: ['admin', 'owner'],
    reasonList: ['Razón de prueba 1', 'Razón de prueba 2'],
  });

  return (
    <div style={{ padding: 50 }}>
      <h2>Test PIN Authorization</h2>
      <Button type="primary" onClick={showModal}>
        Abrir Modal de Autorización
      </Button>
      <PinAuthorizationModal {...modalProps} />
    </div>
  );
};
```

**Pasos:**

1. Agregar componente a una ruta de test
2. Navegar al componente
3. Hacer clic en botón
4. Autorizar con PIN

**Resultado esperado:**

- ✅ Modal se abre
- ✅ Autorización funciona
- ✅ Alert muestra nombre del autorizador
- ✅ Console.log muestra objeto completo

---

## 📋 Checklist de Testing Completo

### Funcionalidad Core

- [ ] Generar PIN
- [ ] Regenerar PIN
- [ ] Desactivar PIN
- [ ] Validar PIN correcto
- [ ] Validar PIN incorrecto
- [ ] Validar PIN expirado
- [ ] Fallback a contraseña

### Permisos y Roles

- [ ] Solo admin puede configurar PINs
- [ ] Solo roles permitidos pueden autorizar
- [ ] Usuario de otro negocio no puede acceder

### Módulos

- [ ] PIN funciona en módulo habilitado
- [ ] PIN no funciona en módulo no habilitado

### UI/UX

- [ ] Copiar PIN
- [ ] Imprimir PIN
- [ ] Estadísticas correctas
- [ ] Estados visuales correctos (tags de color)

### Seguridad

- [ ] PINs hasheados en BD
- [ ] Logs de auditoría completos
- [ ] Input solo acepta números
- [ ] Expiración funciona correctamente

### Integración

- [ ] Hook useAuthorizationPin funciona
- [ ] Modal reutilizable funciona
- [ ] Integración en InvoiceEditAuthorizations funciona

---

## 🐛 Reporte de Bugs

Si encuentras bugs durante el testing, documenta:

1. **Descripción**: ¿Qué pasó?
2. **Pasos para reproducir**: ¿Cómo llegaste al bug?
3. **Resultado esperado**: ¿Qué debería pasar?
4. **Resultado actual**: ¿Qué pasó en realidad?
5. **Screenshots**: Si es posible
6. **Console errors**: Errores en consola del navegador
7. **Firestore**: Estado de los documentos relevantes

---

## ✅ Testing Exitoso

Al completar todas las pruebas:

1. Marcar checklist completo
2. Documentar cualquier bug encontrado
3. Verificar que todo funciona en diferentes navegadores
4. Hacer pruebas de rendimiento con muchos usuarios
5. Revisar logs de auditoría para confirmar registro correcto

El sistema está listo para producción cuando todos los items del checklist están ✅

---

**Happy Testing! 🎉**
