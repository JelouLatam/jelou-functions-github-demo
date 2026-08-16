# jelou-functions-github-demo

Demostración de una **Jelou Function** cuyo código vive en GitHub y se publica con un clic (**Run workflow**).

La Function aplica una **política de elegibilidad de microcrédito**: recibe el monto pedido, los datos del cliente ya consultados y el resultado del screening, y responde `approved` o `rejected` con el monto a desembolsar. No es un buró ni un motor de riesgo. Es la regla de negocio, fuera de la cabeza del AI Agent.

La Function **no consulta nada**. El flujo trae los hechos —historial por DNI, listas negras— y se los pasa ya resueltos. Eso la mantiene determinista: el mismo input siempre da el mismo output, y se prueba entera con `curl` sin credenciales ni datos de producción.

El AI Agent conversa y pide solo lo que la persona sabe de memoria: su DNI, cuánto necesita y la cuenta de destino. Esta Function decide. Si Riesgo cambia un umbral, se edita una constante, se publica, y el bot ya usa la política nueva.

> **Este repositorio es una plantilla.** No existe un deploy oficial. Cada developer hace fork, conecta su propia cuenta de Jelou y despliega en su propia Company.

## Qué demuestra

- Cómo estructurar el código con `define()` y validación Zod.
- Cómo probar en local con `curl`.
- Cómo desplegar con Jelou CLI o desde GitHub Actions (`workflow_dispatch`).
- El wow: cambias `MAX_AMOUNT`, das **Run workflow**, y el mismo payload cambia de `rejected` a `approved`.

No consume APIs externas ni secretos.

## Arquitectura

```
GitHub (este repo)
   └── código de la política
          │
          ▼
   Run workflow  →  jelou functions deploy
          │
          ▼
Jelou Functions
   └── HTTP + herramienta MCP para el AI Agent
```

GitHub versiona la regla. Jelou la ejecuta.

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- CLI de Jelou:

```bash
npm install -g @jelou/cli
```

- Autenticación:

```bash
jelou login
jelou whoami
```

Crea la API key del CLI en [apps.jelou.ai/settings/api-keys](https://apps.jelou.ai/settings/api-keys). Detalle en la [autenticación del CLI](https://docs.jelou.ai/guides/cli/autenticacion).

## Uso como plantilla

**1. Haz fork** de este repositorio.

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

**4. Inicializa tu Function** (en tu Company; `jelou.json` no se commitea):

```bash
jelou functions init --slug github-demo --mode create
```

Si ya existe una Function con ese slug:

```bash
jelou functions init --slug github-demo --mode link
```

## Política vigente

En `index.ts`, arriba del archivo:

| Constante | Valor | Significado |
|-----------|-------|-------------|
| `MAX_AMOUNT` | `150` | Tope del microcrédito (USD) |
| `MIN_MONTHS` | `3` | Antigüedad mínima como cliente |
| `MAX_MORA` | `15` | Mora máxima permitida, en días |
| (implícito) | un crédito | Si `hasActiveLoan` es `true`, se rechaza |
| (implícito) | lista negra | Si `onBlocklist` es `true`, se rechaza |

Cualquier regla que falle → `rejected`, `approvedAmount` en `0` y la lista `reasons`. Si todas pasan → `approved`, `approvedAmount` con el monto pedido y `nextStep` en `biometrics`.

Estar en lista negra es un **hecho** que trae el flujo. Que ese hecho rechace la solicitud es **política**, y por eso vive acá.

## Ejecución local

```bash
jelou functions dev
```

Queda en `http://localhost:3000`.

## Pruebas

El payload viene armado como lo armaría el flujo: el monto pedido por un lado, los datos que trajo la consulta por otro.

### Aprobado

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "requestedAmount": 120,
    "client": {
      "documentId": "0102938475",
      "monthsAsClient": 8,
      "hasActiveLoan": false,
      "daysInArrears": 0
    },
    "screening": { "onBlocklist": false }
  }'
```

```json
{
  "decision": "approved",
  "approvedAmount": 120,
  "reasons": ["Cumple la política vigente"],
  "nextStep": "biometrics"
}
```

### Rechazado: el monto supera el tope

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "requestedAmount": 180,
    "client": {
      "documentId": "0102938475",
      "monthsAsClient": 8,
      "hasActiveLoan": false,
      "daysInArrears": 0
    },
    "screening": { "onBlocklist": false }
  }'
```

```json
{
  "decision": "rejected",
  "approvedAmount": 0,
  "reasons": ["El monto supera el tope de $150"],
  "nextStep": "none"
}
```

### Rechazado: está en lista negra

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "requestedAmount": 80,
    "client": {
      "documentId": "0102938475",
      "monthsAsClient": 12,
      "hasActiveLoan": false,
      "daysInArrears": 0
    },
    "screening": { "onBlocklist": true }
  }'
```

### Validación: falta `client`

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"requestedAmount": 100}'
```

Respuesta esperada: `400 Bad Request` de Zod.

## El cambio que se publica

1. En `index.ts`, cambia `MAX_AMOUNT` de `150` a `200`.
2. Commit en tu fork.
3. **Actions → Deploy to Jelou Functions → Run workflow**.
4. El `curl` de `$180` pasa de `rejected` a `approved`.

Eso es lo que GitHub aporta: la política queda versionada y se publica con un clic. El AI Agent no se reentrena.

## Despliegue manual (CLI)

```bash
jelou functions deploy --dry-run
jelou functions deploy
```

GitHub Actions ejecuta el mismo CLI en un runner.

## Despliegue con GitHub Actions

El workflow (`.github/workflows/deploy.yml`) solo corre con **Run workflow**. No se dispara en cada push.

En **tu fork**:

1. API key del CLI en [apps.jelou.ai/settings/api-keys](https://apps.jelou.ai/settings/api-keys).
2. **Settings → Secrets and variables → Actions → New repository secret**
   - **Name:** `JELOU_TOKEN`
   - **Value:** esa API key

Luego: **Actions → Deploy to Jelou Functions → Run workflow**.

## Usarla en un AI Agent

Después del deploy, en Brain Studio:

**AI Agent → Tools → Servidores MCP externos**

| Campo | Valor |
|-------|-------|
| URL | `https://github-demo.fn.jelou.ai/mcp` |
| Header | `Authorization` = `Bearer sk_...` |

La API key de invocación se crea en [apps.jelou.ai](https://apps.jelou.ai) (configuración de la app). No uses `JELOU_TOKEN` para llamar el endpoint.

Guía: [Functions → Brain Studio](https://docs.jelou.ai/guides/functions/brain).

El Agent pide DNI, monto y cuenta de destino, y busca el historial con la [tool nativa de bases de datos](https://docs.jelou.ai/guides/agentes-ia/tools-nativas) o el [nodo Datum](https://docs.jelou.ai/guides/nodos/datum). Esta Function aplica la política. Si la respuesta trae `nextStep` en `biometrics`, lo que sigue es el [nodo Biometría](https://docs.jelou.ai/guides/integraciones/identidad/biometria-webview), y recién después el desembolso.

## Estructura

```
├── index.ts                 # Política + handler
├── jelou.example.json       # Plantilla (commitada)
├── jelou.json               # Function ID local (gitignore)
├── deno.json
├── .github/workflows/deploy.yml
└── README.md
```
