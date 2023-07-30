import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import { Prisma } from "@prisma/client";

export const documentRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        text: z.string(),
        name: z.string(),
        folderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const createdDocument = await ctx.prisma.documents.create({
        data: {
          content: input.text,
          name: input.name,
          folderId: input.folderId,
        } as Prisma.DocumentsCreateInput,
      });
      return createdDocument; // Return the created document instead of a string
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.documents.findMany();
  }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedDocument = await ctx.prisma.documents.delete({
        where: {
          id: input.id,
        },
      });
      return deletedDocument;
    }),
});
