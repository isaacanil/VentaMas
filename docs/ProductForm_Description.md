# Documentación de Campos de ProductForm

El formulario `ProductForm` está estructurado actualmente mediante un sistema de pestañas (**Tabs**), aunque por el momento solo la pestaña **General** está activa y visible.

---

## 1. Pestaña: General
Esta sección contiene la lógica principal del producto y está dividida en dos columnas principales.

### Columna Izquierda

#### A. Información del Producto (`ProductInfo`)
| Campo | Elemento | Descripción y Funcionamiento |
| :--- | :--- | :--- |
| **Nombre** | `Input` (Texto) | **Requerido**. Nombre identificador del producto. Mínimo 4 caracteres. |
| **Tipo de ítem** | `Select` | **Requerido**. Define si es un "Producto", "Servicio" o "Combo". Cambia el comportamiento del inventario. |
| **Tipo de Producto** | `Input` (Texto) | **Requerido**. Categoría descriptiva (ej: "Medicamento", "Bebida"). Afecta las etiquetas de otros campos como Marca. |
| **Contenido Neto** | `Input` (Texto) | Capacidad o contenido del envase (ej: "500ml", "1kg"). |
| **Marca / Laboratorio** | `Select` (Búsqueda) | Permite seleccionar una marca existente o abrir un modal para crear una nueva. La etiqueta cambia dinámicamente según el "Tipo de Producto". |
| **Categoría** | `Select` (Búsqueda) | Clasificación jerárquica del producto en el catálogo. |
| **Principio Activo** | `Select` (Búsqueda) | Uso específico para farmacias/médicos. Permite registrar el componente químico principal. |
| **Tamaño / Medida** | `Input` (Texto) | Detalles físicos adicionales del producto. |
| **Pie de página** | `Input` (Texto) | Texto informativo opcional que puede aparecer en etiquetas o facturas. |

#### B. Gestión de Inventarios (`InventoryInfo`)
| Campo | Elemento | Descripción y Funcionamiento |
| :--- | :--- | :--- |
| **Inventariable** | `Checkbox` | Determina si el sistema debe llevar el conteo de existencias. |
| **Restringir venta sin stock** | `Checkbox` | Si está activo, impide que el producto se venda si la existencia llega a cero. |
| **Stock** | `InputNumber` | **Requerido**. Cantidad inicial disponible. Se bloquea (`disabled`) cuando el producto ya está creado y se está editando. |
| **Cant. por Paquete** | `InputNumber` | **Requerido**. Define cuántas unidades vienen en un paquete (útil para ventas al por mayor/menudeo). |
| **Se vende por peso** | `Checkbox` | Indica si el producto requiere una balanza para determinar su precio final en la venta. |
| **Unidad de Medida** | `Select` | Visibilidad condicional: Solo aparece si "Se vende por peso" está marcado (ej: kg, lb, oz). |

#### C. Información de Precio (`PriceInfo`)
| Campo | Elemento | Descripción y Funcionamiento |
| :--- | :--- | :--- |
| **Facturable** | `Checkbox` | Determina si el producto es visible en el módulo de ventas/facturación. |
| **Costo** | `InputNumber` | **Requerido**. El costo base de adquisición por unidad. Es el punto de partida para calcular ganancias. |
| **Impuesto** | `Select` | **Requerido**. Selecciona el porcentaje de impuesto (ITBIS/IVA) aplicable. Muestra una advertencia si el sistema de impuestos está desactivado globalmente. |

---

### Columna Derecha

#### D. Multimedia y Códigos
| Elemento | Tipo | Descripción y Funcionamiento |
| :--- | :--- | :--- |
| **Imagen** | Componente Visual | Muestra la foto actual del producto. Incluye un botón para abrir el **ImageManager** y cargar/cambiar imágenes. |
| **Código QR** | `Input` + Vista Previa | Campo `qrcode`. Permite ingresar texto/URL y genera una vista previa del código QR en tiempo real. |
| **Código de Barras** | `Input` + Vista Previa | Campo `barcode`. Valida formatos estándar (EAN, UPC). Incluye botones para **Imprimir** etiquetas y un **Generador** automático basado en el ID del negocio. |

#### E. Garantía (`WarrantyInfo`)
| Campo | Elemento | Descripción y Funcionamiento |
| :--- | :--- | :--- |
| **Aplica garantía** | `Checkbox` | Activa o desactiva la sección de garantía. |
| **Cantidad** | `InputNumber` | Valor numérico del tiempo de cobertura. |
| **Unidad** | `Select` | Escala de tiempo para la garantía (Días, Meses, Años). |

---

### Sección Inferior (Ancho Completo)

#### F. Calculadora de Precios (`PriceCalculator`)
Es una tabla interactiva encargada de manejar los diferentes niveles de precios.

| Nivel de Precio | Campo en Tabla | Descripción |
| :--- | :--- | :--- |
| **Precio Lista** | `InputNumber` | Precio estándar de venta al público. |
| **Precio Medio** | `InputNumber` | Precio intermedio para clientes frecuentes. |
| **Precio Mínimo** | `InputNumber` | El límite más bajo al que se permite vender el producto. |
| **Precio Tarjeta** | `InputNumber` | Precio ajustado para pagos con tarjeta/crédito. |
| **Precio Oferta** | `InputNumber` | Precio promocional temporal. |

**Columnas Calculadas Automáticamente en la Tabla:**
*   **Itbis:** Monto exacto del impuesto basado en el precio ingresado.
*   **Total:** Precio final que pagará el cliente (Monto + Impuesto).
*   **Margen:** Ganancia bruta en moneda (Precio sin impuesto - Costo).
*   **% Ganancia:** Porcentaje de rentabilidad sobre el precio de venta.

---

### Acciones del Formulario (Footer)
*   **Cancelar:** Limpia los campos, descarta los cambios en el estado global (Redux) y cierra el modal.
*   **Crear / Actualizar:** Ejecuta la validación de campos, limpia los datos (sanitización) y guarda los cambios en Firebase.
