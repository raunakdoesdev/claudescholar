import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next"
// import { authOptions } from "~/pages/api/auth/[...nextauth]"

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
          folder: {
            connect: {
              id: input.folderId,
            },
          },
          user: {
            connect: {
              id: ctx.session?.user.id,
            },
          },
        } as Prisma.DocumentsCreateInput,
      });
      return createdDocument; // Return the created document instead of a string
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    if (!ctx.session?.user.id) {
      return []; 
    }

    return ctx.prisma.documents.findMany({
      where: {
        userId: ctx.session?.user.id,
      },
    });
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

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string(),
        name: z.string(),
        folderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedDocument = await ctx.prisma.documents.update({
        where: {
          id: input.id,
        },
        data: {
          content: input.text,
          name: input.name,
          folderId: input.folderId,
        } as Prisma.DocumentsUpdateInput,
      });
      return updatedDocument;
    }),
});
