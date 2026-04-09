# Repo guidance

## ⚙️ Entorno y Comandos
- **PowerShell 7.5.4 (Windows/PS):** Todos los comandos en las respuestas deben estar adaptados exclusivamente a esta versión.
- **Despliegue de Cloud Functions:** Cada vez que se modifique código dentro de `functions/`, se debe incluir el comando para desplegar **solo** las funciones afectadas: 
 `firebase deploy --only "functions:nombreDeLaFuncion"`

## 🏗️ Arquitectura y Estructura
- **División de Componentes:** Separar el código en carpetas `utils/`, `components/`, `hooks/`, u otras correspondientes dentro de la misma carpeta del componente padre.
- **Estilos (Styled-Components):** Mover los estilos a los archivos de cada subcomponente. Solo centralizar estilos en un archivo común si se reutilizan en varios subcomponentes.

## ⚛️ React Hooks + Lint (`react-hooks/set-state-in-effect`)
- **Evitar setState en el cuerpo del useEffect:** No llamar `setState` directamente para sincronizar estado derivado.
- **Estado Derivado:** Calcularlo durante el render (o usar un `safeValue` al leer).
- **Sistemas Externos:** Si el efecto sincroniza con Firestore (`onSnapshot`), event listeners o timers, realizar el `setState` dentro del callback del sistema externo, no en el cuerpo del efecto.
- **Eslint-disable:** Prohibido salvo último recurso y con justificación técnica.

## 🧠 Principios de Ingeniería y Complejidad
- **Evaluación de Complejidad:** Antes de cada implementación, evaluar si se está agregando **complejidad esencial** (propia del problema) o **complejidad accidental** (innecesaria).
- **Pilares del Software:** Las soluciones deben alinearse con:
  * **Modularidad y Cohesión:** Tareas bien definidas y separadas.
  * **Bajo Acoplamiento:** Minimizar dependencias entre piezas.
  * **Abstracción y Reutilización:** Crear interfaces útiles sin sobre-ingeniería.
  * **Simplicidad:** Priorizar siempre la solución más directa y mantenible.