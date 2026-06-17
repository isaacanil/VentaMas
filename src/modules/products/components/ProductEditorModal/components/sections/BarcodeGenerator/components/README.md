# BarcodeGenerator - Componentes

Este directorio contiene las piezas activas que usa `BarcodeGenerator.tsx`.

## Estructura activa

### GenerateTab.tsx

- Renderiza el formulario principal para generar códigos.
- Maneja el modo automático/manual desde props.
- Permite elegir el estándar GS1 y alternar el uso de prefijo empresarial.
- Delega la generación al callback `handleGenerateCode`.

### ConfigurationTab.tsx

- Renderiza el formulario de configuración del prefijo empresarial.
- Valida que el prefijo tenga solo números y una longitud entre 4 y 7 dígitos.
- Comunica los cambios al contenedor mediante `handleCompanyPrefixChange`.

## Flujo de datos

```text
BarcodeGenerator
    ├── GenerateTab
    └── ConfigurationTab
```

`BarcodeGenerator.tsx` conserva el estado, la generación, la persistencia y el modal de configuración. Estos componentes solo renderizan la UI correspondiente al formulario activo.
