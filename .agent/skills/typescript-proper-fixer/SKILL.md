---
name: TypeScript Proper Fixer
description: Systematically fix TypeScript errors by understanding the codebase context, creating proper types and interfaces, not just suppressing errors
version: 1.0.0
author: VentaMas Team
---

# TypeScript Proper Fixer Skill

## Objetivo

Este skill está diseñado para **solucionar errores de TypeScript de forma correcta y profesional**, no simplemente "tapar" errores con `any` o `@ts-ignore`. El enfoque es entender el contexto completo del código, analizar las dependencias y crear tipos e interfaces apropiadas.

## Filosofía

❌ **NO HACER:**
- Usar `any` como solución rápida
- Agregar `@ts-ignore` sin justificación
- Hacer type assertions sin entender el tipo real
- Copiar tipos sin entender su propósito
- Ignorar errores relacionados

✅ **SÍ HACER:**
- Investigar el origen de los datos
- Leer archivos relacionados para entender el contexto
- Crear tipos e interfaces semánticas y reutilizables
- Documentar decisiones de tipado complejas
- Validar que la solución no rompa otras partes del código

## Proceso Sistemático

### Fase 1: Análisis del Error

1. **Identificar el error exacto**
   - Leer el mensaje de error completo
   - Identificar el archivo, línea y columna
   - Clasificar el tipo de error (implicit any, undefined, type mismatch, etc.)

2. **Entender el contexto**
   - Ver el archivo completo donde ocurre el error
   - Identificar la función/componente afectado
   - Entender qué está tratando de hacer el código

### Fase 2: Investigación de Dependencias

3. **Rastrear el origen de los datos**
   - Si es un prop: buscar dónde se usa el componente
   - Si es una función: buscar sus llamadas
   - Si es un estado: buscar su inicialización
   - Si es una API: buscar la definición del endpoint

4. **Revisar archivos relacionados**
   - Buscar tipos existentes que puedan reutilizarse
   - Revisar interfaces en el mismo módulo
   - Verificar tipos en archivos de definición (`types.ts`, `interfaces.ts`)
   - Buscar patrones similares en el codebase

5. **Identificar dependencias circulares**
   - Verificar si hay imports circulares
   - Identificar si el tipo debe moverse a un archivo compartido

### Fase 3: Diseño de la Solución

6. **Decidir la estrategia de tipado**
   - ¿Necesito crear un nuevo tipo/interface?
   - ¿Puedo reutilizar un tipo existente?
   - ¿Necesito un tipo genérico?
   - ¿Es apropiado usar un utility type (Partial, Pick, Omit, etc.)?

7. **Ubicar los tipos correctamente**
   - Tipos específicos de componente: en el mismo archivo
   - Tipos compartidos en módulo: en `types.ts` del módulo
   - Tipos globales: en `src/types/` o similar
   - Props de componentes: interface con nombre descriptivo

8. **Nombrar tipos semánticamente**
   - Props: `[ComponentName]Props`
   - State: `[Feature]State`
   - API Response: `[Entity]Response` o `[Entity]Data`
   - Handlers: `[Action]Handler` o `On[Action]`
   - Genéricos: nombres descriptivos, no solo `T`

### Fase 4: Implementación

9. **Crear tipos e interfaces**
   ```typescript
   // ✅ BUENO: Tipo descriptivo y completo
   interface ProductListModalProps {
     products: Product[];
     onSelect: (product: Product) => void;
     isOpen: boolean;
     onClose: () => void;
   }

   // ❌ MALO: Usar any
   interface ProductListModalProps {
     products: any[];
     onSelect: any;
     isOpen: boolean;
     onClose: any;
   }
   ```

10. **Aplicar tipos a parámetros y variables**
    ```typescript
    // ✅ BUENO: Tipos explícitos
    const handleProductSelect = (product: Product): void => {
      dispatch(addProduct(product));
    };

    // ❌ MALO: Tipos implícitos
    const handleProductSelect = (product) => {
      dispatch(addProduct(product));
    };
    ```

11. **Manejar casos opcionales y nullables correctamente**
    ```typescript
    // ✅ BUENO: Manejo explícito de undefined/null
    interface UserProfile {
      name: string;
      email: string;
      avatar?: string; // Opcional
      lastLogin: Date | null; // Puede ser null
    }

    const displayAvatar = (user: UserProfile): string => {
      return user.avatar ?? '/default-avatar.png';
    };

    // ❌ MALO: Ignorar posibilidad de undefined
    const displayAvatar = (user: any): string => {
      return user.avatar;
    };
    ```

### Fase 5: Validación

12. **Verificar que no se rompan otras partes**
    - Buscar todos los usos del componente/función modificada
    - Verificar que los tipos sean compatibles
    - Ejecutar TypeScript compiler para ver nuevos errores

13. **Revisar errores relacionados**
    - Ver si el cambio soluciona errores en cascada
    - Identificar errores similares que pueden solucionarse de la misma forma

14. **Documentar decisiones complejas**
    ```typescript
    /**
     * Representa el estado de un producto en el carrito.
     * 
     * @property amountToBuy - Puede ser un número simple o un objeto InvoiceProductAmount
     *                         para productos con múltiples unidades de medida
     */
    interface CartProduct {
      id: string;
      amountToBuy: number | InvoiceProductAmount;
    }
    ```

## Patrones Comunes y Soluciones

### Patrón 1: Props implícitas con `any`

**Error:**
```typescript
// Parameter 'props' implicitly has an 'any' type
const MyComponent = (props) => { ... }
```

**Solución:**
```typescript
interface MyComponentProps {
  title: string;
  onAction: () => void;
  data?: DataType;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction, data }) => {
  // ...
}
```

### Patrón 2: Styled Components con props

**Error:**
```typescript
// Parameter 'props' implicitly has an 'any' type
const StyledDiv = styled.div`
  color: ${props => props.active ? 'blue' : 'gray'};
`;
```

**Solución:**
```typescript
interface StyledDivProps {
  active: boolean;
}

const StyledDiv = styled.div<StyledDivProps>`
  color: ${props => props.active ? 'blue' : 'gray'};
`;
```

### Patrón 3: Event Handlers

**Error:**
```typescript
// Parameter 'e' implicitly has an 'any' type
const handleClick = (e) => { ... }
```

**Solución:**
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
  e.preventDefault();
  // ...
}
```

### Patrón 4: Redux State/Actions

**Error:**
```typescript
// Property 'user' does not exist on type 'never'
const user = state.auth.user;
```

**Solución:**
```typescript
// En types.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RootState {
  auth: AuthState;
  // ... otros estados
}

// En el componente
const user = useSelector((state: RootState) => state.auth.user);
```

### Patrón 5: API Responses

**Error:**
```typescript
// Object is of type 'unknown'
const data = await fetchData();
```

**Solución:**
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
}

const response = await fetchData<ApiResponse<ProductData>>();
const product = response.data; // Tipado correctamente
```

### Patrón 6: Utility Types para Transformaciones

**Escenario:** Necesitas un tipo similar pero con algunas propiedades opcionales

```typescript
// Tipo base
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// Para crear producto (sin id)
type CreateProductInput = Omit<Product, 'id'>;

// Para actualizar producto (todo opcional excepto id)
type UpdateProductInput = Partial<Product> & Pick<Product, 'id'>;

// Para vista de producto (solo lectura)
type ProductView = Readonly<Product>;
```

## Checklist de Calidad

Antes de considerar completada una corrección, verificar:

- [ ] ✅ El error de TypeScript está completamente resuelto
- [ ] ✅ No se usó `any` innecesariamente
- [ ] ✅ No se usó `@ts-ignore` sin justificación documentada
- [ ] ✅ Los tipos son semánticos y descriptivos
- [ ] ✅ Se reutilizaron tipos existentes cuando fue apropiado
- [ ] ✅ Los tipos están ubicados en el lugar correcto
- [ ] ✅ Se manejaron correctamente casos opcionales y nullables
- [ ] ✅ Se verificó que no se rompieron otras partes del código
- [ ] ✅ Se documentaron decisiones complejas
- [ ] ✅ El código es más mantenible que antes

## Herramientas de Análisis

### Comandos útiles para investigación:

```bash
# Ver todos los errores de TypeScript
npx tsc --noEmit

# Buscar usos de un tipo/componente
rg "ComponentName" src/

# Buscar definiciones de tipos
rg "interface.*Props" src/

# Ver imports de un archivo
rg "^import" src/path/to/file.tsx
```

### Archivos clave a revisar:

- `src/types/` - Tipos globales
- `src/interfaces/` - Interfaces compartidas
- `tsconfig.json` - Configuración de TypeScript
- `*.types.ts` - Archivos de definición de tipos por módulo

## Ejemplos de Casos Reales

### Caso 1: Fixing Invoice Form Types

**Contexto:** El slice de Redux para facturas tiene errores de tipos en cálculos

**Proceso:**
1. Revisar `invoiceFormSlice.ts`
2. Identificar que `amountToBuy` puede ser `number | InvoiceProductAmount`
3. Buscar definición de `InvoiceProductAmount`
4. Crear type guards para diferenciar casos
5. Aplicar tipos correctos en cálculos

**Solución:**
```typescript
// Type guard
function isInvoiceProductAmount(
  amount: number | InvoiceProductAmount
): amount is InvoiceProductAmount {
  return typeof amount === 'object' && amount !== null;
}

// Uso en cálculo
const quantity = isInvoiceProductAmount(product.amountToBuy)
  ? product.amountToBuy.value
  : product.amountToBuy;
```

### Caso 2: Fixing Styled Component Props

**Contexto:** Múltiples styled components con props sin tipo

**Proceso:**
1. Identificar todas las props usadas en el styled component
2. Crear interface descriptiva
3. Aplicar tipo genérico al styled component
4. Verificar todos los usos del componente

**Solución:**
```typescript
interface ContainerProps {
  $isActive: boolean;
  $variant?: 'primary' | 'secondary';
}

const Container = styled.div<ContainerProps>`
  background: ${props => props.$isActive ? 'blue' : 'gray'};
  padding: ${props => props.$variant === 'primary' ? '20px' : '10px'};
`;
```

## Notas Importantes

1. **Priorizar legibilidad sobre brevedad**: Es mejor tener tipos explícitos y claros que tipos complejos y difíciles de entender.

2. **Evitar sobre-ingeniería**: No crear tipos genéricos complejos si un tipo simple es suficiente.

3. **Consistencia**: Seguir los patrones de tipado existentes en el proyecto.

4. **Migración gradual**: Si el proyecto tiene muchos `any`, migrar gradualmente, priorizando código crítico.

5. **Comunicación**: Documentar decisiones importantes en comentarios o en la documentación del proyecto.

## Recursos Adicionales

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
