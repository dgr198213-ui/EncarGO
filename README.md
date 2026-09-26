# EncarGO

**EncarGO** es una plataforma para convertir necesidades expresadas en lenguaje cotidiano en encargos estructurados y ejecutables para profesionales creativos. La aplicación funciona como una capa de traducción entre la intención de una persona y un flujo de trabajo técnico: recibe una petición, identifica qué se necesita, propone una interpretación confirmable y prepara los pasos necesarios para llevarla a cabo.

El proyecto combina un frontend React orientado a la conversación y la confirmación con un backend Express, persistencia en Supabase y un Router multi-IA que dirige cada paso hacia el conector adecuado.

## Funciones principales

### Intake conversacional

La persona usuaria puede describir su necesidad en lenguaje natural, sin tener que conocer de antemano la terminología técnica ni definir un brief completo. El backend analiza la petición mediante el módulo de intake, clasifica el tipo de encargo y extrae los parámetros relevantes para convertir la intención en datos estructurados.

El analista de intake utiliza proveedores configurables y valida la respuesta mediante esquemas compartidos. El sistema conserva la descripción original y los parámetros extraídos para que el encargo pueda revisarse antes de ejecutarse.

### Espejo de confirmación

Antes de iniciar cualquier ejecución, EncarGO presenta una interpretación legible de lo que ha entendido. Este paso permite corregir el alcance, comprobar los datos extraídos y confirmar que el encargo representa realmente la necesidad original.

La confirmación separa la comprensión de la ejecución. De esta manera, una acción externa no se inicia únicamente porque el sistema haya generado una primera interpretación automática.

### Gestión de encargos

Cada encargo tiene identidad, propietario, tipo, descripción, parámetros extraídos, estado y pasos de ejecución. El backend ofrece rutas para crear, consultar, confirmar y ejecutar encargos, aplicando el filtro de usuario correspondiente en las operaciones de persistencia.

Los estados permiten seguir el ciclo de vida del trabajo:

| Estado | Significado |
|---|---|
| `borrador` | El encargo ha sido creado, pero todavía no se ha confirmado. |
| `confirmado` | La interpretación ha sido revisada y autorizada para ejecución. |
| `ejecutando` | Sus pasos se están procesando mediante el Router. |
| `completado` | Todos los pasos han finalizado correctamente. |
| `fallido` | Uno o más pasos han producido un error y su resultado queda registrado. |

### Router multi-IA

El Router dirige cada paso según el tipo de encargo y desacopla la lógica del flujo de los proveedores concretos. En la Fase 4 están disponibles los siguientes conectores:

| Tipo de paso | Conector | Función |
|---|---|---|
| `contenido` | Conector de contenido | Ejecuta o prepara tareas de generación y transformación de contenido. |
| `automatizacion` | Conector de Zapier | Envía los datos del encargo a un webhook de Zapier configurado por la persona propietaria del despliegue. |
| `diseno` | Pendiente | El tipo está contemplado, pero su conector específico queda reservado para una fase posterior. |
| `administrativo` | Pendiente | El tipo está contemplado, pero su conector específico queda reservado para una fase posterior. |

El ejecutor procesa los pasos en orden, guarda el resultado individual de cada uno y actualiza el estado global del encargo. Los errores no dejan el encargo en un estado ambiguo: se registran en el paso correspondiente y el encargo termina como `fallido` cuando procede.

### Historial y contexto de negocio

El frontend permite consultar los encargos existentes y trabajar con el contexto de negocio que ayuda a interpretar nuevas solicitudes. El historial ofrece continuidad entre peticiones y facilita revisar qué se solicitó, qué se confirmó y cuál fue el resultado de la ejecución.

### Autenticación y aislamiento de datos

La aplicación integra autenticación mediante Supabase en el cliente y el servidor. Las rutas del backend verifican la identidad de la petición y filtran los registros por `usuario_id`, evitando que un usuario consulte o modifique encargos pertenecientes a otra cuenta.

La clave `SUPABASE_SERVICE_ROLE_KEY` se utiliza únicamente en el servidor. Nunca debe exponerse al navegador ni incluirse en el repositorio.

## Arquitectura

EncarGO se divide en tres áreas principales:

| Área | Tecnologías y responsabilidad |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS y componentes Radix. Gestiona autenticación, intake, confirmación, historial y estado de la interfaz. |
| Backend | Node.js, Express, TypeScript y Supabase. Expone la API, valida la identidad, procesa el intake y ejecuta los encargos. |
| Persistencia e integraciones | Supabase para datos y autenticación; proveedores de IA para el intake; conectores de contenido y Zapier para la ejecución. |

El código compartido de `shared/` contiene los tipos y contratos utilizados por cliente y servidor. Las migraciones SQL de `supabase/migrations/` describen el esquema esperado y deben aplicarse manualmente en el proyecto de Supabase correspondiente.

## Flujo de un encargo

1. La persona usuaria inicia sesión y describe una necesidad en lenguaje natural.
2. El frontend envía la petición al endpoint de intake.
3. El analista clasifica la solicitud y extrae sus parámetros.
4. El sistema crea un encargo con sus pasos de ejecución.
5. La interfaz muestra el espejo de confirmación.
6. La persona usuaria confirma o corrige el encargo.
7. El backend marca el encargo como `ejecutando` y procesa los pasos en orden.
8. Cada resultado se persiste individualmente y el encargo termina como `completado` o `fallido`.

> La ejecución real depende de que los proveedores y conectores estén configurados en el entorno. El repositorio no contiene claves ni URLs privadas.

## Estructura del proyecto

```text
client/
  src/
    components/       Componentes de interfaz y autenticación
    contexts/         Contexto de sesión y tema
    lib/              Cliente Supabase y cliente HTTP de la API
    pages/            Pantallas principales de la aplicación
server/
  intake/             Esquemas, proveedores y analista de intake
  router/             Ejecutor y conectores de ejecución
  routes/             Rutas HTTP de encargos e intake
  auth.ts             Autenticación y usuario de la petición
  index.ts            Servidor Express y configuración CORS
shared/
  types.ts            Tipos compartidos entre frontend y backend
supabase/
  migrations/         Migraciones SQL para la base de datos
vite.config.ts        Configuración de Vite y proxy local de la API
vercel.json           Configuración del frontend estático en Vercel
```

## Configuración local

Copia el archivo de ejemplo y completa únicamente las variables necesarias para tu entorno:

```bash
cp .env.example .env
```

Las variables principales son:

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase utilizada por el servidor. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada del servidor para operaciones protegidas. |
| `VITE_SUPABASE_URL` | URL de Supabase disponible para el cliente. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima utilizada por el cliente. |
| `GEMINI_API_KEY` | Credencial opcional del proveedor de intake correspondiente. |
| `ZAI_API_KEY` | Credencial opcional del proveedor alternativo de intake. |
| `ZAPIER_WEBHOOK_URL` | Webhook de Zapier usado por el conector de automatización. |
| `CORS_ORIGIN` | Orígenes autorizados para llamar a la API, separados por comas. |
| `VITE_API_URL` | URL base de la API en producción, normalmente con el sufijo `/api`. |
| `PORT` | Puerto local del backend; el valor predeterminado del proyecto es `3001`. |

En desarrollo local, `VITE_API_URL` puede permanecer vacío. Vite redirige las peticiones `/api` al backend local mediante el proxy configurado en `vite.config.ts`.

## Desarrollo

Instala las dependencias con pnpm:

```bash
pnpm install
```

Inicia el frontend:

```bash
pnpm dev
```

En otra terminal, inicia el backend Express:

```bash
pnpm dev:api
```

El frontend se sirve mediante Vite y la API queda disponible en el puerto definido por `PORT`. La configuración de desarrollo utiliza el proxy `/api`, por lo que el navegador puede comunicarse con el backend local sin necesidad de configurar una URL pública.

## Verificación y compilación

Comprueba los tipos del proyecto:

```bash
pnpm check
```

Construye el frontend y el bundle del backend:

```bash
pnpm build
```

Para validar cada destino de despliegue por separado:

```bash
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Despliegue

### Frontend en Vercel

Vercel debe construir únicamente el frontend estático. `vercel.json` define `dist/public` como directorio de salida y utiliza `pnpm vite build` como comando de construcción. En el proyecto de Vercel configura las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_API_URL`.

### Backend en Railway

Railway ejecuta el bundle del servidor Express. El comando de inicio del proyecto es:

```bash
pnpm start
```

En Railway configura las variables privadas de Supabase, las credenciales de los proveedores, `CORS_ORIGIN` con el dominio del frontend de Vercel y la URL del webhook de Zapier cuando se utilice el conector de automatización. Railway inyecta su propio valor de `PORT` en producción.

La separación entre frontend y backend es intencionada: Vercel sirve los archivos estáticos y Railway mantiene el proceso Express que expone la API.

## Migraciones de Supabase

Las migraciones incluidas en `supabase/migrations/` deben aplicarse manualmente desde el proyecto de Supabase. No se ejecutan automáticamente durante la instalación, la compilación ni el despliegue.

## Estado del producto

EncarGO dispone actualmente de un MVP funcional con autenticación, intake estructurado, persistencia de encargos, confirmación previa, Router multi-IA y conectores de contenido y automatización. Los conectores específicos para diseño y operaciones administrativas, así como una ampliación de las integraciones de proveedores, quedan como líneas naturales de evolución.

La dirección visual del producto está documentada en [`ideas.md`](./ideas.md) y sigue el enfoque editorial **“Taller de confianza”**.
