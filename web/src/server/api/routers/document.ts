import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const documentRouter = createTRPCRouter({
  add: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(({ ctx, input }) => {
      ctx.prisma.documents.create({
        data: {
          content: input.text,
        },
      });
      return "added to db";
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.documents.findMany();
  }),
});
