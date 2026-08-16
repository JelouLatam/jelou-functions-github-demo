import { define, z } from "@jelou/functions";

// La política, en tres líneas. Esto es lo que Riesgo va a querer cambiar.
const MAX_AMOUNT = 150;
const MIN_MONTHS = 3;
const MAX_MORA = 15;

export default define({
  name: "microcredit-eligibility",
  description:
    "Decide si un microcrédito se aprueba según la política vigente. Recibe los datos del cliente ya consultados; no consulta bases de datos ni burós.",
  input: z.object({
    requestedAmount: z.number().positive().describe("Monto que pidió la persona, en dólares"),
    client: z
      .object({
        documentId: z.string().describe("DNI del cliente"),
        monthsAsClient: z.number().int().nonnegative(),
        hasActiveLoan: z.boolean(),
        daysInArrears: z.number().int().nonnegative(),
      })
      .describe("Datos que vienen de la base. No se le preguntan al cliente."),
    screening: z
      .object({ onBlocklist: z.boolean() })
      .describe("Resultado de la consulta a listas negras"),
  }),
  output: z.object({
    decision: z.enum(["approved", "rejected"]),
    approvedAmount: z.number().describe("Monto a desembolsar. Cero si se rechaza."),
    reasons: z.array(z.string()).describe("Por qué se aprobó o rechazó"),
    nextStep: z.enum(["biometrics", "none"]).describe("Qué le toca hacer al flujo después"),
  }),
  handler: async ({ requestedAmount, client, screening }, ctx) => {
    const reasons: string[] = [];

    if (requestedAmount > MAX_AMOUNT) {
      reasons.push(`El monto supera el tope de $${MAX_AMOUNT}`);
    }
    if (screening.onBlocklist) {
      reasons.push("El cliente está en lista negra");
    }
    if (client.monthsAsClient < MIN_MONTHS) {
      reasons.push(`Se requieren al menos ${MIN_MONTHS} meses como cliente`);
    }
    if (client.hasActiveLoan) {
      reasons.push("Ya tiene un crédito vigente");
    }
    if (client.daysInArrears > MAX_MORA) {
      reasons.push(`La mora supera ${MAX_MORA} días`);
    }

    const approved = reasons.length === 0;

    ctx.log("Decisión de microcrédito", {
      documentId: client.documentId,
      requestedAmount,
      decision: approved ? "approved" : "rejected",
    });

    return {
      decision: approved ? "approved" : "rejected",
      approvedAmount: approved ? requestedAmount : 0,
      reasons: approved ? ["Cumple la política vigente"] : reasons,
      nextStep: approved ? "biometrics" : "none",
    };
  },
});
