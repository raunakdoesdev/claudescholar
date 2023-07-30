import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import { Prisma } from "@prisma/client";

export const documentRouter = createTRPCRouter({
  add: publicProcedure
    .input(z.object({ text: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const createdDocument = await ctx.prisma.documents.create({
        data: {
          content: input.text,
          name: input.name,
        } as Prisma.DocumentsCreateInput,
      });
      return createdDocument; // Return the created document instead of a string
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.documents.findMany();
  }),

  // New endpoint for file upload and processing
  uploadAndProcessFile: publicProcedure
    .input(z.object({ fileData: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        
        // Step 1: Upload the file and perform the action on the external server
        const response = await axios.post("https://external-server.example/upload", {
          fileData: input.fileData,
        });

        const resultText = response.data.resultText; // Assuming the response format from the external server is { resultText: '...' }

        // Step 2: Save the result text to the document collection in Prisma
        const savedDocument = await ctx.prisma.documents.create({
          data: {
            content: resultText,
            // Any other associated data you want to save with the result text
          },
        });

        return savedDocument;
      } catch (error) {
        console.error("Error processing file:", error);
        throw new Error("File processing failed");
      }
    }),
});
