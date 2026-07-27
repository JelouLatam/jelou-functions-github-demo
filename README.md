# jelou-functions-github-demo

Demostración mínima de una **Jelou Function** desplegable desde GitHub.

## ¿Qué demuestra este repositorio?

Este repo muestra el flujo completo de desarrollo de una Jelou Function:

- Cómo estructurar el código con `define()` y validación Zod.
- Cómo correr y probar la función localmente.
- Cómo desplegarla manualmente con el CLI de Jelou.
- Cómo automatizar el despliegue desde GitHub Actions con un solo secret.

La función en sí es intencionalmente simple: recibe un `orderId` y devuelve un estado simulado de orden. No consume APIs externas ni secretos.

> **Este repositorio es una plantilla.** No existe un deploy oficial — cada developer hace fork, conecta su propia cuenta de Jelou y despliega en su propia Company. Ver [Uso como plantilla](#uso-como-plantilla).

## Arquitectura

```
GitHub (este repo)
   └── almacena el código fuente
          │
          ▼
   jelou functions deploy
          │
          ▼
Jelou Functions (Deno Subhosting)
   └── expone el endpoint HTTP + herramienta MCP
```

GitHub es el repositorio del código. Jelou Functions es quien lo ejecuta en producción.

## Requisitos

- [Node.js](https://nodejs.org/) 18+ (para instalar el CLI de Jelou)
- CLI de Jelou:

```bash
npm install -g @jelou/cli
```

- Autenticación activa:

```bash
jelou login
```

## Uso como plantilla

Este repositorio no tiene un deploy oficial ni está ligado a ninguna Company de Jelou. Es una plantilla: cada developer la usa en su propia cuenta.

### Flujo recomendado

**1. Haz fork del repositorio en GitHub**

Usa el botón **Fork** en GitHub. Esto crea tu propia copia del repo donde podrás configurar tus secrets y ejecutar los workflows.

**2. Clona tu fork**

```bash
git clone https://github.com/<tu-usuario>/jelou-functions-github-demo
cd jelou-functions-github-demo
```

**3. Instala el CLI y autentícate**

```bash
npm install -g @jelou/cli
jelou login
```

El CLI te pedirá tu token de acceso personal. Consulta la [documentación oficial de Jelou Functions](https://docs.jelou.ai/guides/functions/autenticacion) para saber cómo obtenerlo según tu tipo de cuenta.

**4. Inicializa tu propia Function**

Crea la Function en tu Company y genera tu `jelou.json` local (gitignoreado — no se commitea):

```bash
jelou functions init --slug github-demo --mode create
```

Si ya tienes una Function con ese slug en tu Company:

```bash
jelou functions init --slug github-demo --mode link
```

A partir de este punto puedes desarrollar, probar y desplegar de forma independiente.

## Ejecución local

Inicia el servidor de desarrollo con hot reload:

```bash
jelou functions dev
```

El servidor queda disponible en `http://localhost:3000`.

## Pruebas

### Caso exitoso

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-001"}'
```

Respuesta esperada (`200 OK`):

```json
{
  "orderId": "ORD-001",
  "status": "approved",
  "updatedAt": "2026-07-27T16:40:20.491Z"
}
```

### Validación: `orderId` vacío

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"orderId": ""}'
```

Respuesta esperada (`400 Bad Request`):

```json
{
  "error": "Validation failed",
  "details": [{ "path": ["orderId"], "message": "String must contain at least 1 character(s)", "code": "too_small" }]
}
```

### Validación: sin `orderId`

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{}'
```

Respuesta esperada (`400 Bad Request`):

```json
{
  "error": "Validation failed",
  "details": [{ "path": ["orderId"], "message": "Required", "code": "invalid_type" }]
}
```

## Despliegue manual

> Requiere haber completado el [Uso como plantilla](#uso-como-plantilla).

Para previsualizar qué se subiría sin hacer el deploy:

```bash
jelou functions deploy --dry-run
```

Para desplegar a producción:

```bash
jelou functions deploy
```

## Despliegue con GitHub Actions

El workflow en `.github/workflows/deploy.yml` se ejecuta **únicamente de forma manual** desde la pestaña Actions de tu fork (`Run workflow`). No hay trigger automático por push.

### Configuración (una sola vez, en tu fork)

1. Obtén tu token de acceso personal de Jelou (`jfn_pat_...`). Consulta la [documentación oficial](https://docs.jelou.ai/guides/functions/autenticacion) — el proceso varía según el tipo de cuenta.
2. En tu fork en GitHub, ve a:
   `Settings → Secrets and variables → Actions → New repository secret`
3. Crea el secret:
   - **Name:** `JELOU_TOKEN`
   - **Value:** tu token de Jelou

### Cómo ejecutar el workflow

1. Ve a la pestaña **Actions** de tu fork.
2. Selecciona **Deploy to Jelou Functions**.
3. Haz clic en **Run workflow → Run workflow**.

El workflow copia la plantilla, crea o enlaza la Function en la Company asociada a tu token, y despliega.

## Estructura del proyecto

```
├── index.ts            # Entrypoint de la función
├── jelou.example.json  # Plantilla de configuración (commitada)
├── jelou.json          # Configuración local con tu Function ID (gitignoreada)
├── deno.json           # Import map para @jelou/functions
├── .env                # Variables locales para dev (gitignoreada)
└── README.md           # Este archivo
```
