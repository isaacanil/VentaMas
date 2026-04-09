# 1. Mapa de Validaciones

## Login Form

- **Archivo:** `src/modules/auth/pages/Login/components/LoginForm.tsx`
- **Reglas:**
  - `password` requerido.
  - No hay longitud mínima, regex de complejidad ni validaciones adicionales.
- **Mensajes:**
  - "Ingresa la contraseña."

## Registro de Usuarios (UI)

- **Archivo:** `src/modules/settings/pages/setting/subPage/Users/components/UserForm.tsx` (SignUpModal)
- **Reglas (cuando NO es modo edición):**
  - `password` requerido.
  - Debe contener al menos **1 mayúscula** (`/(?=.*[A-Z])/`).
  - Debe contener al menos **1 minúscula** (`/(?=.*[a-z])/`).
  - Debe contener al menos **1 número** (`/(?=.*[0-9])/`).
  - **No hay longitud mínima explícita**.
- **Mensajes:**
  - "Por favor, ingresa tu contraseña!"
  - "La contraseña debe tener al menos una letra mayúscula."
  - "La contraseña debe tener al menos una letra minúscula."
  - "La contraseña debe tener al menos un número"

## Cambio de Contraseña (UI)

### 1) Modal de cambio administrado (política fuerte)

- **Archivo:** `src/modules/settings/pages/setting/subPage/Users/components/UsersList/ChangeUserPasswordModal.tsx`
- **Reglas:**
  - `password` requerido.
  - **Mínimo 8 caracteres**.
  - **1 mayúscula**, **1 minúscula**, **1 número**.
  - `confirmPassword` requerido y debe **coincidir**.
- **Mensajes:**
  - "Por favor ingresa la nueva contraseña."
  - "Debe tener al menos 8 caracteres."
  - "Incluye al menos una letra mayúscula."
  - "Incluye al menos una letra minúscula."
  - "Incluye al menos un número."
  - "Confirma la nueva contraseña."
  - "Las contraseñas no coinciden."

### 2) Cambio de contraseña con validación mínima (solo required)

- **Archivo:** `src/modules/settings/pages/setting/subPage/Users/components/EditUser/ChangePassword/ChangePassword.tsx`
- **Reglas:**
  - `oldPassword` requerido.
  - `newPassword` requerido.
  - **Sin reglas de complejidad ni longitud**.
- **Mensajes:**
  - "Por favor ingrese su contraseña antigua"
  - "Por favor ingrese su nueva contraseña"

### 3) Control Panel (validación mínima)

- **Archivo:** `src/modules/controlPanel/AllUsersControl/components/Users/ChangerPasswordModal.tsx`
- **Reglas:**
  - `password` requerido.
- **Mensajes:**
  - "Por favor ingresa la nueva contraseña."

### 4) Validación manual en EditUser (potencial legado)

- **Archivo:** `src/modules/settings/pages/setting/subPage/Users/components/EditUser/EditUser.tsx`
- **Reglas (manuales, no `Form.Item`):**
  - `password` requerido.
  - **Mínimo 8 caracteres**.
  - **1 mayúscula**, **1 minúscula**, **1 número**.
- **Mensajes:**
  - "Password es requerido"
  - "La contraseña debe tener al menos 8 caracteres."
  - "La contraseña debe tener al menos una letra mayúscula."
  - "La contraseña debe tener al menos una letra minúscula."
  - "La contraseña debe tener al menos un número."
- **Nota:** En este componente no aparece un input de password directo; esta validación parece depender del estado del usuario y podría ser legado o usada indirectamente.

## Autorización por PIN

### 1) Modal PIN con fallback a contraseña

- **Archivo:** `src/components/modals/PinAuthorizationModal/PinAuthorizationModal.tsx`
- **Reglas PIN:**
  - El input **solo acepta dígitos** (se filtran con `replace(/\D/g, '')`).
  - **Longitud exacta 6**; si no, error.
- **Mensajes PIN:**
  - "El PIN debe tener 6 dígitos"
  - "PIN inválido"
- **Reglas en modo contraseña (fallback):**
  - `username` requerido.
  - `password` requerido.
  - Sin complejidad ni longitud.
- **Mensajes fallback:**
  - "Ingrese el nombre de usuario"
  - "Ingrese la contraseña"

### 2) Peer Review Authorization (password)

- **Archivo:** `src/components/modals/PeerReviewAuthorization/PeerReviewAuthorization.tsx`
- **Reglas:**
  - `name` requerido.
  - `password` requerido.
  - Sin complejidad ni longitud.
- **Mensajes:**
  - "Por favor ingrese su usuario"
  - "Por favor ingrese su contraseña"

# 2. Herramientas Detectadas

- **No se detecta uso de Zod/Yup/React Hook Form** en los formularios de contraseña.
- Validaciones se hacen con:
  - **Ant Design Form rules** (`Form.Item` con `rules`, `pattern`, `min`).
  - **Validaciones manuales** con `if/regex` (ej. `EditUser.tsx`, `PinAuthorizationModal.tsx`).

# 3. Textos de Error (Resumen)

- Login:
  - "Ingresa la contraseña."
- Registro (SignUpModal):
  - "Por favor, ingresa tu contraseña!"
  - "La contraseña debe tener al menos una letra mayúscula."
  - "La contraseña debe tener al menos una letra minúscula."
  - "La contraseña debe tener al menos un número"
- Cambio de contraseña (UsersList modal):
  - "Por favor ingresa la nueva contraseña."
  - "Debe tener al menos 8 caracteres."
  - "Incluye al menos una letra mayúscula."
  - "Incluye al menos una letra minúscula."
  - "Incluye al menos un número."
  - "Confirma la nueva contraseña."
  - "Las contraseñas no coinciden."
- Cambio de contraseña (EditUser modal):
  - "Por favor ingrese su contraseña antigua"
  - "Por favor ingrese su nueva contraseña"
- Control Panel (ChangerPasswordModal):
  - "Por favor ingresa la nueva contraseña."
- PIN Auth:
  - "El PIN debe tener 6 dígitos"
  - "PIN inválido"
  - "Ingrese el nombre de usuario"
  - "Ingrese la contraseña"
- EditUser (validación manual):
  - "Password es requerido"
  - "La contraseña debe tener al menos 8 caracteres."
  - "La contraseña debe tener al menos una letra mayúscula."
  - "La contraseña debe tener al menos una letra minúscula."
  - "La contraseña debe tener al menos un número."
