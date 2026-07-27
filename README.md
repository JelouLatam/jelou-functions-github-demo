# jelou-functions-github-demo

Demostración mínima de una **Jelou Function** desplegable desde GitHub.

## ¿Qué demuestra este repositorio?

Este repo muestra el flujo completo de desarrollo de una Jelou Function:

- Cómo estructurar el código con `define()` y validación Zod.
- Cómo correr y probar la función localmente.
- Cómo desplegarla manualmente con el CLI de Jelou.
- (próximamente) Cómo automatizar el despliegue desde GitHub Actions.

La función en sí es intencional mente simple: recibe un `orderId` y devuelve un estado simulado de orden. No consume APIs externas ni secretos.

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

## Instalación

Este proyecto usa Deno Subhosting en producción. Para desarrollo local, el CLI de Jelou gestiona el entorno automáticamente — no necesitas instalar Deno ni dependencias adicionales.

Clona el repositorio y entra al directorio:

```bash
git clone <url-del-repo>
cd jelou-functions-github-demo
```

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

> Requiere haber iniciado sesión con `jelou login` y tener acceso a la organización.

Para previsualizar qué se subiría sin hacer el deploy:

```bash
jelou functions deploy --dry-run
```

Para desplegar a producción:

```bash
jelou functions deploy
```

## Estructura del proyecto

```
├── index.ts       # Entrypoint de la función
├── jelou.json     # Vincula el proyecto al slug remoto en Jelou
├── deno.json      # Import map para @jelou/functions
├── .env           # Variables locales para dev (no se sube a Git)
└── README.md      # Este archivo
```
