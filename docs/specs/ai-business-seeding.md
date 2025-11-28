# Especificación: Creación de Negocio y Usuarios con IA (Gemini)

Este documento detalla la implementación de una nueva funcionalidad para desarrolladores que permite poblar (seed) un negocio y sus usuarios a partir de un prompt en lenguaje natural utilizando Gemini.

## 1. Objetivo

Facilitar la creación rápida de entornos de prueba o nuevos clientes permitiendo ingresar un bloque de texto (e.g., copiado de un correo o mensaje) y generar automáticamente las estructuras de datos necesarias en Firebase.

**Entrada de Ejemplo:**
```text
Negocio: DIFACAM SRL
Dirección: Los Restauradores calle Manganagua #35
Teléfono: 8099164941
RNC: 133280159
Usuarios: 
- Samuel Castro — Admin
- Maria Perez — Cajera
```

**Salida Esperada (Acción):**
1. Crear documento en `businesses`.
2. Crear documentos en `users` vinculados a ese negocio.

## 2. Estructuras de Datos

Basado en el análisis de `BusinessEditorProfile.jsx` y `UserForm.jsx`.

### 2.1 Modelo de Negocio (Business)
Campos soportados por la API de Firebase existente:

```typescript
interface BusinessData {
  name: string;           // Requerido
  rnc?: string;           // "133280159"
  address?: string;       // "Los Restauradores..."
  tel?: string;           // "8099164941"
  email?: string;
  country?: string;
  province?: string;
  businessType?: string;  // Default: "general"
  invoice?: {
    invoiceMessage?: string;
    invoiceType?: string; // Default: "invoiceTemplate1"
  };
}
```

### 2.2 Modelo de Usuario (User)
Campos soportados por `fbSignUp` / `fbUpdateUser`:

```typescript
interface UserData {
  name: string;       // Username (min 3 chars, lowercase). Ej: "samuel.castro"
  realName?: string;  // "Samuel Castro"
  role: UserRole;     // "admin", "cashier", "manager", "owner", "dev"
  password: string;   // Generada o proveída. Requerimiento: 1 Mayus, 1 Minus, 1 Num.
  active: boolean;    // Default: true
}

type UserRole = 'dev' | 'owner' | 'admin' | 'manager' | 'buyer' | 'cashier';
```

## 3. Prompt para Gemini

El prompt del sistema debe instruir a Gemini para extraer estos datos y devolver un JSON estricto.

**System Prompt:**
```markdown
Eres un asistente experto en extracción de datos para sistemas SaaS.
Tu tarea es convertir un texto no estructurado con información de un negocio y usuarios en un objeto JSON estricto.

# Reglas de Negocio:
1. **Business**:
   - Extrae 'name', 'rnc', 'address', 'tel' (teléfono), 'email'.
   - Si no hay 'businessType', usa "general".
   - Si no hay configuración de factura, usa los defaults.

2. **Usuarios**:
   - Genera un 'username' ('name') basado en el nombre real (ej: "Samuel Castro" -> "samuel.c" o "samuelcastro"). Debe ser todo minúsculas, sin espacios.
   - Mapea los roles del texto a estos valores exactos: 'dev', 'owner', 'admin', 'manager', 'buyer', 'cashier'.
     - "Admin/Administrador" -> "admin"
     - "Cajero/Cajera" -> "cashier"
     - "Dueño/Gerente" -> "owner" (o "manager" según contexto).
   - Genera una contraseña segura temporal para cada usuario (ej: "Temp1234$") si no se especifica.

# Formato de Salida (JSON ONLY):
{
  "business": {
    "name": "String",
    "rnc": "String",
    "address": "String",
    "tel": "String",
    "email": "String",
    "businessType": "general"
  },
  "users": [
    {
      "realName": "String",
      "name": "String (username)",
      "role": "String (enum)",
      "password": "String"
    }
  ]
}
```

## 4. Plan de Implementación

### 4.1 Nueva Ruta (UI)
Crear una pantalla oculta o para desarrolladores, ej: `/dev/ai-seeding`.

**Componentes:**
1.  **Text Area:** Para pegar el texto crudo ("Negocio: ...").
2.  **Button:** "Analizar con Gemini".
3.  **Preview/Editor:** Mostrar el JSON resultante en un editor (tipo Monaco o simple `textarea`) para correcciones manuales antes de confirmar.
4.  **Button:** "Ejecutar Seeding".
5.  **Log Console:** Mostrar progreso ("Creando negocio...", "Creando usuario 1...", "Listo").

### 4.2 Integración con Gemini
Usar la SDK de Google Generative AI (ya presente en el proyecto o agregarla si falta, o usar `fetch` directo si hay una cloud function proxy).

*Nota: Si no se quiere exponer la API Key en el frontend, esto debería pasar por una Firebase Cloud Function.*

### 4.3 Lógica de Guardado
1.  Llamar `createBusiness(businessData)` (de `src/firebase/businessInfo/fbAddBusinessInfo.js`).
2.  Obtener el `businessId` retornado.
3.  Iterar sobre el array de `users`.
4.  Para cada usuario:
    - Inyectar el `businessId`.
    - Llamar `fbSignUp(userPayload)` (de `src/firebase/Auth/fbAuthV2/fbSignUp.js`).

## 5. Tareas (ToDo)
1. [ ] Crear vista `/dev/ai-seeding`.
2. [ ] Implementar servicio para llamar a Gemini (client-side o server-side).
3. [ ] Implementar lógica de parseo y validación del JSON.
4. [ ] Implementar orquestador de creación (Business -> Users).
