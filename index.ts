import { define, z } from "@jelou/functions";

/**
 * Política de elegibilidad (no es un buró ni un motor de riesgo).
 * Cambia estas constantes, publica con Run workflow, y el Agent ya usa la regla nueva.
 */
const MAX_AMOUNT = 150;
const MIN_MONTHS_AS_CLIENT = 3;
const MAX_DAYS_IN_ARREARS = 15;

const Decision = z.enum(["approved", "rejected"]);

export default define({
  name: "microcredit-eligibility",
  description:
    "Decide si un microcrédito se aprueba según la política vigente. Úsala cuando el cliente pida un préstamo o un adelanto.",
  input: z.object({
    amount: z
      .number()
      .positive()
      .describe("Monto solicitado en dólares"),
    monthsAsClient: z
      .number()
      .int()
      .nonnegative()
      .describe("Meses como cliente"),
    hasActiveLoan: z
      .boolean()
      .describe("Si ya tiene un crédito vigente"),
    daysInArrears: z
      .number()
      .int()
      .nonnegative()
      .describe("Días de mora actual"),
  }),
  output: z.object({
    decision: Decision.describe("approved o rejected"),
    reasons: z
      .array(z.string())
      .describe("Por qué se aprobó o rechazó, para que el Agent se lo explique al cliente"),
    policy: z.object({
      maxAmount: z.number(),
      minMonthsAsClient: z.number(),
      maxDaysInArrears: z.number(),
    }),
  }),
  handler: async (input, ctx) => {
    const reasons: string[] = [];

    if (input.amount > MAX_AMOUNT) {
      reasons.push(`El monto supera el tope de $${MAX_AMOUNT}`);
    }
    if (input.monthsAsClient < MIN_MONTHS_AS_CLIENT) {
      reasons.push(`Se requieren al menos ${MIN_MONTHS_AS_CLIENT} meses como cliente`);
    }
    if (input.hasActiveLoan) {
      reasons.push("Ya tiene un crédito vigente");
    }
    if (input.daysInArrears > MAX_DAYS_IN_ARREARS) {
      reasons.push(`La mora supera ${MAX_DAYS_IN_ARREARS} días`);
    }

    const decision = reasons.length === 0 ? "approved" : "rejected";
    if (decision === "approved") {
      reasons.push("Cumple la política vigente");
    }

    ctx.log("Evaluando microcrédito", {
      amount: input.amount,
      decision,
      policyMaxAmount: MAX_AMOUNT,
    });

    return {
      decision,
      reasons,
      policy: {
        maxAmount: MAX_AMOUNT,
        minMonthsAsClient: MIN_MONTHS_AS_CLIENT,
        maxDaysInArrears: MAX_DAYS_IN_ARREARS,
      },
    };
  },
});
