import { define, z } from "@jelou/functions";

export default define({
  name: "order-status",
  description: "Retorna el estado simulado de una orden por su ID",
  input: z.object({
    orderId: z.string().min(1).describe("ID de la orden a consultar"),
  }),
  output: z.object({
    orderId: z.string().describe("ID de la orden"),
    status: z.literal("approved").describe("Estado de la orden"),
    updatedAt: z.string().describe("Fecha y hora de la consulta (ISO 8601)"),
  }),
  handler: async (input, ctx) => {
    ctx.log("Consultando orden", { orderId: input.orderId });

    return {
      orderId: input.orderId,
      status: "approved" as const,
      updatedAt: new Date().toISOString(),
    };
  },
});
