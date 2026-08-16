# jelou-functions-github-demo

Demostración de una **Jelou Function** cuyo código vive en GitHub y se publica con un clic (**Run workflow**).

La Function aplica una **política de elegibilidad de microcrédito**: recibe monto, antigüedad, si ya hay un crédito y días de mora, y responde `approved` o `rejected`. No es un buró ni un motor de riesgo. Es la regla de negocio, fuera de la cabeza del AI Agent.

El AI Agent conversa y junta los datos. Esta Function decide. Si Riesgo cambia un umbral, se edita una constante, se publica, y el bot ya usa la política nueva.

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
| `MIN_MONTHS_AS_CLIENT` | `3` | Antigüedad mínima |
| `MAX_DAYS_IN_ARREARS` | `15` | Mora máxima permitida |
| (implícito) | un crédito | Si `hasActiveLoan` es `true`, se rechaza |

Cualquier regla que falle → `rejected` y la lista `reasons`. Si todas pasan → `approved`.

## Ejecución local

```bash
jelou functions dev
```

Queda en `http://localhost:3000`.

## Pruebas

### Aprobado

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"amount":120,"monthsAsClient":8,"hasActiveLoan":false,"daysInArrears":0}'
```

```json
{
  "decision": "approved",
  "reasons": ["Cumple la política vigente"],
  "policy": {
    "maxAmount": 150,
    "minMonthsAsClient": 3,
    "maxDaysInArrears": 15
  }
}
```

### Rechazado: el monto supera el tope

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"amount":180,"monthsAsClient":8,"hasActiveLoan":false,"daysInArrears":0}'
```

```json
{
  "decision": "rejected",
  "reasons": ["El monto supera el tope de $150"],
  "policy": {
    "maxAmount": 150,
    "minMonthsAsClient": 3,
    "maxDaysInArrears": 15
  }
}
```

### Rechazado: ya tiene un crédito

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"amount":80,"monthsAsClient":12,"hasActiveLoan":true,"daysInArrears":0}'
```

### Validación: `amount` faltante

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{}'
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

El Agent pregunta monto y datos al cliente. Esta Function aplica la política.

## Estructura

```
├── index.ts                 # Política + handler
├── jelou.example.json       # Plantilla (commitada)
├── jelou.json               # Function ID local (gitignore)
├── deno.json
├── .github/workflows/deploy.yml
└── README.md
```
