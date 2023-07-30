import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const folderRouter = createTRPCRouter({
  add: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const createdFolder = await ctx.prisma.folders.create({
        data: {
          title: input.text,
        },
      });
      return createdFolder; // Return the created document instead of a string
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    console.log("Query called");
    return ctx.prisma.folders.findMany();
  }),
});
