# jelou-functions-github-demo

Demostración mínima de una **Jelou Function** desplegable desde GitHub.

## ¿Qué demuestra este repositorio?

Este repo muestra el flujo completo de desarrollo de una Jelou Function:

- Cómo estructurar el código con `define()` y validación Zod.
- Cómo correr y probar la función localmente.
- Cómo desplegarla manualmente con el CLI de Jelou.
- Cómo automatizar el despliegue desde GitHub Actions con un solo secret.

La función en sí es intencionalmente simple: recibe un `orderId` y devuelve un estado simulado de orden. No consume APIs externas ni secretos.

> **Este repositorio es una plantilla.** Cualquier developer puede clonarlo, inicializar su propia Function en su propia Company, y desplegarlo de forma independiente. Ver [Configuración inicial](#configuración-inicial).

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

## Configuración inicial

Este repositorio no incluye `jelou.json` porque ese archivo contiene el ID de una Function específica de una Company — es personal, como una variable de entorno. Cada developer genera el suyo.

### 1. Clona el repositorio

```bash
git clone https://github.com/JelouLatam/jelou-functions-github-demo
cd jelou-functions-github-demo
```

### 2. Autentícate con tu cuenta de Jelou

```bash
jelou login
```

### 3. Inicializa tu propia Function

Esto crea la Function en tu Company y genera tu `jelou.json` local (no se commitea):

```bash
jelou functions init --slug github-demo --mode create
```

Si ya tienes una Function con ese slug en tu Company, usa `--mode link`:

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

> Requiere haber completado la [Configuración inicial](#configuración-inicial).

Para previsualizar qué se subiría sin hacer el deploy:

```bash
jelou functions deploy --dry-run
```

Para desplegar a producción:

```bash
jelou functions deploy
```

## Despliegue automático con GitHub Actions

El workflow en `.github/workflows/deploy.yml` se ejecuta en cada push a `main` y en ejecuciones manuales desde la pestaña Actions.

### Configuración (una sola vez)

1. Obtén tu PAT de Jelou (`jfn_pat_...`) desde el dashboard de Jelou.
2. En tu repositorio (o fork), ve a:
   `Settings → Secrets and variables → Actions → New repository secret`
3. Crea el secret:
   - **Name:** `JELOU_TOKEN`
   - **Value:** tu PAT de Jelou

El workflow crea o enlaza automáticamente la Function en la Company asociada a tu token, y luego despliega.

## Estructura del proyecto

```
├── index.ts            # Entrypoint de la función
├── jelou.example.json  # Plantilla de configuración (commitada)
├── jelou.json          # Configuración local con tu Function ID (gitignoreada)
├── deno.json           # Import map para @jelou/functions
├── .env                # Variables locales para dev (gitignoreada)
└── README.md           # Este archivo
```
