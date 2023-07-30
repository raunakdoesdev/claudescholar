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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedFolder = await ctx.prisma.folders.delete({
        where: {
          id: input.id,
        },
      });
      return deletedFolder;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), text: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updatedFolder = await ctx.prisma.folders.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.text,
        },
      });
      return updatedFolder;
    }),
});
