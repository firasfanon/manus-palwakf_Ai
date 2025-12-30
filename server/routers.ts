import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getFrequentQuestions } from "./learning";
import { faqs } from "../drizzle/schema";
import {
  getKnowledgeDocuments,
  getKnowledgeDocumentById,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  incrementFAQViewCount,
  getConversationById,
  getUserConversations,
  createConversation,
  updateConversation,
  getConversationMessages,
  createMessage,
  createSearchLog,
  getWaqfProperties,
  getWaqfPropertyById,
  createWaqfProperty,
  updateWaqfProperty,
  deleteWaqfProperty,
  getWaqfCases,
  getWaqfCaseById,
  createWaqfCase,
  updateWaqfCase,
  deleteWaqfCase,
  getJudicialRulings,
  getJudicialRulingById,
  createJudicialRuling,
  updateJudicialRuling,
  deleteJudicialRuling,
  getWaqfDeeds,
  getWaqfDeedById,
  createWaqfDeed,
  updateWaqfDeed,
  deleteWaqfDeed,
  getMinisterialInstructions,
  getMinisterialInstructionById,
  createMinisterialInstruction,
  updateMinisterialInstruction,
  deleteMinisterialInstruction,
  createFeedback,
  getFeedback,
  updateFeedback,
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  addDocumentFile,
  getDocumentFiles,
  getDocumentFileById,
  deleteDocumentFile,
} from "./db";
import { invokeLLM } from "./_core/llm";
import {
  retrieveRelevantDocuments,
  retrieveRelevantItems,
  extractRelevantContext,
  generateSystemPrompt,
  categorizeQuery,
} from "./rag";
import { generateImprovedSystemPrompt } from "./prompts";
import { getCachedAnswer, cacheAnswer, updateCachedAnswerRating } from "./learning";
import {
  classifyDocument,
  extractInformation,
  summarizeText,
  extractAdvancedEntities,
  analyzePatterns,
} from "./ai-advanced";
import {
  compareRulings,
  analyzePrecedents,
  predictCaseOutcome,
  extractJudicialTrends,
  analyzeLegalRelationships,
} from "./legal-analysis";
import {
  getDigitalLibrary,
  archiveDocument,
  getDocumentLinks,
  advancedDocumentSearch,
  getLibraryStatistics,
} from "./document-management";
import {
  getSiteSettings,
  updateSiteSettings,
  initializeSiteSettings,
} from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { files, messageRatings, conversations, messages } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Knowledge Documents Management (Admin only)
  knowledge: router({
    list: protectedProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getKnowledgeDocuments({
          category: input?.category,
          isActive: true,
          search: input?.search,
        });
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getKnowledgeDocumentById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          category: z.enum(["law", "jurisprudence", "majalla", "historical", "administrative", "reference"]),
          source: z.string().optional(),
          sourceUrl: z.string().optional(),
          pdfUrl: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return await createKnowledgeDocument({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          category: z.enum(["law", "jurisprudence", "majalla", "historical", "administrative", "reference"]).optional(),
          source: z.string().optional(),
          pdfUrl: z.string().optional(),
          sourceUrl: z.string().optional(),
          tags: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const { id, ...updates } = input;
        return await updateKnowledgeDocument(id, updates);
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      await deleteKnowledgeDocument(input.id);
      return { success: true };
    }),

    uploadPdf: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(), // base64 encoded
          fileType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        
        // Import storage function and utilities
        const { storagePut } = await import("./storage");
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const fs = await import("fs");
        const path = await import("path");
        const execAsync = promisify(exec);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");
        
        // Extract text from PDF using pdftotext and OCR
        let extractedText = "";
        let isOcr = false;
        try {
          // Save buffer to temporary file
          const tempDir = "/tmp";
          const tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
          fs.writeFileSync(tempPdfPath, buffer);
          
          // Try extracting text using pdftotext first
          try {
            const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
            extractedText = stdout.trim();
          } catch (error) {
            console.log("pdftotext failed, text might be embedded as images");
          }
          
          // If no text extracted or very little text, try OCR
          if (!extractedText || extractedText.length < 50) {
            console.log("Attempting OCR extraction...");
            try {
              // Convert PDF to images and run OCR
              // First, try with Arabic + English
              const { stdout: ocrOutput } = await execAsync(
                `pdftoppm "${tempPdfPath}" /tmp/page -png && ` +
                `tesseract /tmp/page-1.png stdout -l ara+eng 2>/dev/null || ` +
                `tesseract /tmp/page-1.png stdout -l eng 2>/dev/null`
              );
              const ocrText = ocrOutput.trim();
              
              if (ocrText && ocrText.length > extractedText.length) {
                extractedText = ocrText;
                isOcr = true;
                console.log("OCR extraction successful");
              }
              
              // Clean up temp image files
              await execAsync(`rm -f /tmp/page-*.png`).catch(() => {});
            } catch (ocrError) {
              console.error("OCR extraction failed:", ocrError);
            }
          }
          
          // Clean up temp PDF file
          fs.unlinkSync(tempPdfPath);
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
          // Continue without extracted text if parsing fails
        }
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `knowledge-pdfs/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        
        return { url, fileName: input.fileName, extractedText, isOcr };
      }),

    // Document Files Management
    addFile: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          fileName: z.string(),
          fileData: z.string(), // base64 encoded
          fileType: z.enum(["original", "translation", "supplement", "other"]),
          language: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        // Import storage function and utilities
        const { storagePut } = await import("./storage");
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const fs = await import("fs");
        const path = await import("path");
        const execAsync = promisify(exec);

        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Extract text from PDF using pdftotext and OCR
        let extractedText = "";
        let isOcr = false;
        try {
          const tempDir = "/tmp";
          const tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
          fs.writeFileSync(tempPdfPath, buffer);

          // Try pdftotext first
          try {
            const { stdout } = await execAsync(`pdftotext "${tempPdfPath}" -`);
            extractedText = stdout.trim();
          } catch (error) {
            console.log("pdftotext failed, trying OCR...");
          }

          // If no text or very little, try OCR
          if (!extractedText || extractedText.length < 50) {
            try {
              const { stdout: ocrOutput } = await execAsync(
                `pdftoppm "${tempPdfPath}" /tmp/page -png && ` +
                `tesseract /tmp/page-1.png stdout -l ara+eng 2>/dev/null || ` +
                `tesseract /tmp/page-1.png stdout -l eng 2>/dev/null`
              );
              const ocrText = ocrOutput.trim();

              if (ocrText && ocrText.length > extractedText.length) {
                extractedText = ocrText;
                isOcr = true;
              }

              await execAsync(`rm -f /tmp/page-*.png`).catch(() => {});
            } catch (ocrError) {
              console.error("OCR failed:", ocrError);
            }
          }

          fs.unlinkSync(tempPdfPath);
        } catch (error) {
          console.error("Error extracting text:", error);
        }

        // Upload to S3
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `knowledge-pdfs/${timestamp}-${randomSuffix}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, "application/pdf");

        // Save to database
        const file = await addDocumentFile({
          documentId: input.documentId,
          fileUrl: url,
          fileType: input.fileType,
          fileName: input.fileName,
          fileSize,
          language: input.language,
          extractedText,
          isOcr,
        });

        return file;
      }),

    getFiles: publicProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input }) => {
        return await getDocumentFiles(input.documentId);
      }),

    deleteFile: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        await deleteDocumentFile(input.id);
        return { success: true };
      }),
  }),

  // FAQs Management
  faqs: router({
    list: publicProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getFAQs({
          category: input?.category,
          isActive: true,
        });
      }),

    incrementView: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await incrementFAQViewCount(input.id);
      return { success: true };
    }),

    create: protectedProcedure
      .input(
        z.object({
          question: z.string().min(1),
          answer: z.string().min(1),
          category: z.enum(["general", "conditions", "types", "management", "legal", "jurisprudence"]),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return await createFAQ({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          question: z.string().min(1).optional(),
          answer: z.string().min(1).optional(),
          category: z.enum(["general", "conditions", "types", "management", "legal", "jurisprudence"]).optional(),
          order: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const { id, ...updates } = input;
        return await updateFAQ(id, updates);
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      await deleteFAQ(input.id);
      return { success: true };
    }),
    
    // Generate FAQs from frequent questions (Admin only)
    generateFromFrequentQuestions: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Get frequent questions
        const frequentQuestions = await getFrequentQuestions(input.limit);
        
        // For each question, create a FAQ entry if it doesn't exist
        let created = 0;
        for (const q of frequentQuestions) {
          // Check if FAQ already exists
          const existing = await db
            .select()
            .from(faqs)
            .where(eq(faqs.question, q.content))
            .limit(1);
          
          if (existing.length === 0) {
            // Create new FAQ with placeholder answer
            await db.insert(faqs).values({
              question: q.content,
              answer: 'هذا السؤال تم توليده تلقائياً من الأسئلة المتكررة. يرجى إضافة الإجابة من لوحة التحكم.',
              category: 'general',
              viewCount: q.count,
              isActive: false, // Inactive until admin adds answer
            });
            created++;
          }
        }
        
        return {
          success: true,
          created,
          total: frequentQuestions.length,
        };
      }),
  }),

  // AI Chat and Conversations
  chat: router({
    // Get user's conversations
    myConversations: protectedProcedure.query(async ({ ctx }) => {
      return await getUserConversations(ctx.user.id);
    }),

    // Get conversation by ID with messages
    getConversation: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const conversation = await getConversationById(input.id);
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found or unauthorized");
      }
      const messages = await getConversationMessages(input.id);
      return { conversation, messages };
    }),

    // Create new conversation
    createConversation: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
          category: z.enum(["general", "legal", "jurisprudence", "administrative", "historical"]).default("general"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createConversation({
          userId: ctx.user.id,
          title: input.title,
          category: input.category,
        });
      }),

    // Send message and get AI response
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const conversation = await getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or unauthorized");
        }

        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        // Check cache first for frequently asked questions
        const cachedResult = getCachedAnswer(input.message);
        if (cachedResult && cachedResult.rating >= 0) {
          // Return cached answer
          await createMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: cachedResult.answer,
            sources: cachedResult.sources,
          });

          // Update conversation title if needed
          const history = await getConversationMessages(input.conversationId);
          if (history.length === 0 && !conversation.title) {
            const queryCategory = categorizeQuery(input.message);
            await updateConversation(input.conversationId, {
              title: input.message.substring(0, 100),
              category: queryCategory as any,
            });
          }

          const sources = cachedResult.sources ? JSON.parse(cachedResult.sources) : [];
          return {
            message: cachedResult.answer,
            sources: sources.map((id: number) => ({ id })),
            category: categorizeQuery(input.message),
            cached: true,
          };
        }

        // Categorize query
        const queryCategory = categorizeQuery(input.message);

        // Retrieve relevant documents using RAG
        const relevantDocs = await retrieveRelevantDocuments(input.message, {
          limit: 5,
          minScore: 1,
        });

        // Extract context
        const context = extractRelevantContext(input.message, relevantDocs, 3000);

        // Generate specialized system prompt based on category
        const systemPrompt = generateImprovedSystemPrompt(context, queryCategory);

        // Get conversation history
        const history = await getConversationMessages(input.conversationId);
        const recentHistory = history.slice(-6); // Last 6 messages (3 exchanges)

        // Prepare messages for LLM
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...recentHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ];

        // Get AI response
        const response = await invokeLLM({ messages });

        const messageContent = response.choices[0]?.message?.content;
        const aiMessage = typeof messageContent === 'string' ? messageContent : "عذراً، لم أتمكن من الإجابة على سؤالك.";

        // Save AI response with sources
        const sources = relevantDocs.map((doc) => doc.id);
        await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: aiMessage,
          sources: JSON.stringify(sources),
        });

        // Cache the answer for future use
        cacheAnswer(input.message, aiMessage, JSON.stringify(sources), 0);

        // Update conversation title if it's the first message
        if (history.length === 0 && !conversation.title) {
          await updateConversation(input.conversationId, {
            title: input.message.substring(0, 100),
            category: queryCategory as any,
          });
        }

        // Log search
        await createSearchLog({
          userId: ctx.user.id,
          query: input.message,
          resultsCount: relevantDocs.length,
        });

        return {
          message: aiMessage,
          sources: relevantDocs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            category: doc.category,
            source: doc.source || '',
            tags: doc.tags || '',
            relevanceScore: doc.relevanceScore,
          })),
          category: queryCategory,
        };
      }),

    // Delete conversation
    deleteConversation: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const conversation = await getConversationById(input.id);
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found or unauthorized");
      }
      await updateConversation(input.id, { isActive: false });
      return { success: true };
    }),

    // Rate message
    rateMessage: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          rating: z.enum(["helpful", "not_helpful"]),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        // Check if user already rated this message
        const existingRating = await db
          .select()
          .from(messageRatings)
          .where(
            and(
              eq(messageRatings.messageId, input.messageId),
              eq(messageRatings.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (existingRating.length > 0) {
          // Update existing rating
          await db
            .update(messageRatings)
            .set({
              rating: input.rating,
              feedback: input.feedback,
            })
            .where(eq(messageRatings.id, existingRating[0].id));
        } else {
          // Create new rating
          await db.insert(messageRatings).values({
            messageId: input.messageId,
            userId: ctx.user.id,
            rating: input.rating,
            feedback: input.feedback,
          });
        }

        // Update cache rating if this message is cached
        const message = await db
          .select()
          .from(messages)
          .where(eq(messages.id, input.messageId))
          .limit(1);

        if (message.length > 0 && message[0].role === 'assistant') {
          // Get the user message before this assistant message
          const userMessages = await db
            .select()
            .from(messages)
            .where(
              and(
                eq(messages.conversationId, message[0].conversationId),
                eq(messages.role, 'user')
              )
            )
            .orderBy(desc(messages.createdAt))
            .limit(1);

          if (userMessages.length > 0) {
            const ratingValue = input.rating === 'helpful' ? 1 : -1;
            updateCachedAnswerRating(userMessages[0].content, ratingValue);
          }
        }

        return { success: true };
      }),

    // Get message rating
    getMessageRating: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const rating = await db
          .select()
          .from(messageRatings)
          .where(
            and(
              eq(messageRatings.messageId, input.messageId),
              eq(messageRatings.userId, ctx.user.id)
            )
          )
          .limit(1);

        return rating[0] || null;
      }),

    // Get statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Total conversations
      const totalConversations = await db
        .select({ count: sql<number>`count(*)` })
        .from(conversations)
        .where(eq(conversations.userId, ctx.user.id));

      // Total messages
      const totalMessages = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          inArray(
            messages.conversationId,
            db
              .select({ id: conversations.id })
              .from(conversations)
              .where(eq(conversations.userId, ctx.user.id))
          )
        );

      // Total ratings
      const totalRatings = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRatings)
        .where(eq(messageRatings.userId, ctx.user.id));

      // Positive ratings
      const positiveRatings = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRatings)
        .where(
          and(
            eq(messageRatings.userId, ctx.user.id),
            eq(messageRatings.rating, "helpful")
          )
        );

      // Category counts
      const categoryCounts = await db
        .select({
          category: conversations.category,
          count: sql<number>`count(*)`
        })
        .from(conversations)
        .where(eq(conversations.userId, ctx.user.id))
        .groupBy(conversations.category);

      return {
        totalConversations: Number(totalConversations[0]?.count || 0),
        totalMessages: Number(totalMessages[0]?.count || 0),
        totalRatings: Number(totalRatings[0]?.count || 0),
        positiveRatings: Number(positiveRatings[0]?.count || 0),
        categoryCounts,
      };
    }),
  }),

  // Search in knowledge base
  search: router({
    query: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          category: z.string().optional(),
          limit: z.number().min(1).max(20).default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        const relevantDocs = await retrieveRelevantDocuments(input.query, {
          category: input.category,
          limit: input.limit,
          minScore: 1,
        });

        // Log search if user is authenticated
        if (ctx.user) {
          await createSearchLog({
            userId: ctx.user.id,
            query: input.query,
            resultsCount: relevantDocs.length,
          });
        }

        return relevantDocs;
      }),
  }),

  // Waqf Properties Management
  properties: router({
    list: protectedProcedure
      .input(
        z
          .object({
            governorate: z.string().optional(),
            propertyType: z.string().optional(),
            status: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getWaqfProperties(input);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getWaqfPropertyById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          nationalKey: z.string(),
          name: z.string(),
          propertyType: z.enum(["mosque", "building", "agricultural_land", "shrine", "cemetery", "school", "clinic", "other"]),
          governorate: z.string(),
          city: z.string(),
          address: z.string().optional(),
          area: z.string().optional(),
          waqfType: z.enum(["charitable", "family", "mixed"]),
          status: z.enum(["active", "inactive", "disputed", "under_development"]).optional(),
          description: z.string().optional(),
          documents: z.string().optional(),
          coordinates: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await createWaqfProperty({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            name: z.string().optional(),
            status: z.enum(["active", "inactive", "disputed", "under_development"]).optional(),
            description: z.string().optional(),
            documents: z.string().optional(),
            coordinates: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateWaqfProperty(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteWaqfProperty(input.id);
      return { success: true };
    }),
  }),

  // Waqf Cases Management
  cases: router({
    list: protectedProcedure
      .input(
        z
          .object({
            propertyId: z.number().optional(),
            status: z.string().optional(),
            caseType: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getWaqfCases(input);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getWaqfCaseById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          caseNumber: z.string(),
          propertyId: z.number().optional(),
          title: z.string(),
          description: z.string(),
          caseType: z.enum(["ownership_dispute", "boundary_dispute", "usage_violation", "inheritance", "management_dispute", "encroachment", "other"]),
          status: z.enum(["pending", "under_investigation", "in_court", "resolved", "closed"]).optional(),
          court: z.string().optional(),
          judge: z.string().optional(),
          plaintiff: z.string().optional(),
          defendant: z.string().optional(),
          filingDate: z.date().optional(),
          hearingDate: z.date().optional(),
          verdict: z.string().optional(),
          verdictDate: z.date().optional(),
          documents: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await createWaqfCase({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            status: z.enum(["pending", "under_investigation", "in_court", "resolved", "closed"]).optional(),
            court: z.string().optional(),
            judge: z.string().optional(),
            hearingDate: z.date().optional(),
            verdict: z.string().optional(),
            verdictDate: z.date().optional(),
            notes: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateWaqfCase(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteWaqfCase(input.id);
      return { success: true };
    }),
  }),

  // Judicial Rulings Management
  rulings: router({
    list: protectedProcedure
      .input(
        z
          .object({
            caseId: z.number().optional(),
            propertyId: z.number().optional(),
            rulingType: z.string().optional(),
            status: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getJudicialRulings(input);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getJudicialRulingById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          caseNumber: z.string(),
          title: z.string(),
          court: z.string(),
          judge: z.string().optional(),
          rulingDate: z.date(),
          rulingType: z.enum(["initial", "appeal", "supreme", "cassation"]),
          subject: z.string(),
          summary: z.string(),
          fullText: z.string().optional(),
          legalPrinciple: z.string().optional(),
          relatedArticles: z.string().optional(),
          relatedCases: z.string().optional(),
          propertyId: z.number().optional(),
          caseId: z.number().optional(),
          status: z.enum(["final", "appealable", "appealed"]).optional(),
          tags: z.string().optional(),
          attachments: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await createJudicialRuling({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            status: z.enum(["final", "appealable", "appealed"]).optional(),
            summary: z.string().optional(),
            fullText: z.string().optional(),
            legalPrinciple: z.string().optional(),
            relatedArticles: z.string().optional(),
            relatedCases: z.string().optional(),
            tags: z.string().optional(),
            attachments: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateJudicialRuling(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteJudicialRuling(input.id);
      return { success: true };
    }),
  }),

  // Waqf Deeds Management
  deeds: router({
    list: protectedProcedure
      .input(
        z
          .object({
            propertyId: z.number().optional(),
            waqfType: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getWaqfDeeds(input);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getWaqfDeedById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          deedNumber: z.string(),
          deedDate: z.date(),
          hijriDate: z.string().optional(),
          court: z.string(),
          judge: z.string().optional(),
          waqifName: z.string(),
          waqifDetails: z.string().optional(),
          propertyDescription: z.string(),
          propertyLocation: z.string(),
          propertyBoundaries: z.string().optional(),
          propertyArea: z.string().optional(),
          waqfType: z.enum(["charitable", "family", "mixed"]),
          beneficiaries: z.string(),
          waqifConditions: z.string().optional(),
          administratorName: z.string().optional(),
          administratorConditions: z.string().optional(),
          witnesses: z.string().optional(),
          fullText: z.string().optional(),
          summary: z.string().optional(),
          status: z.enum(["active", "inactive", "disputed", "archived"]).optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
          propertyId: z.number().optional(),
          attachments: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await createWaqfDeed({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            propertyDescription: z.string().optional(),
            beneficiaries: z.string().optional(),
            conditions: z.string().optional(),
            administrator: z.string().optional(),
            fullText: z.string().optional(),
            attachments: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateWaqfDeed(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteWaqfDeed(input.id);
      return { success: true };
    }),
  }),

  // Ministerial Instructions Management
  instructions: router({
    list: protectedProcedure
      .input(
        z
          .object({
            type: z.string().optional(),
            category: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getMinisterialInstructions(input);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getMinisterialInstructionById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          instructionNumber: z.string(),
          title: z.string(),
          content: z.string(),
          type: z.enum(["circular", "instruction", "decision", "regulation", "guideline"]),
          category: z.enum(["administrative", "financial", "legal", "technical", "general"]),
          issueDate: z.date(),
          effectiveDate: z.date().optional(),
          expiryDate: z.date().optional(),
          issuedBy: z.string().optional(),
          attachments: z.string().optional(),
          relatedInstructions: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await createMinisterialInstruction({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            title: z.string().optional(),
            content: z.string().optional(),
            effectiveDate: z.date().optional(),
            expiryDate: z.date().optional(),
            attachments: z.string().optional(),
            tags: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateMinisterialInstruction(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await deleteMinisterialInstruction(input.id);
      return { success: true };
    }),
  }),

  // Feedback System
  feedback: router({
    create: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          rating: z.enum(["helpful", "not_helpful", "partially_helpful"]),
          comment: z.string().optional(),
          suggestedImprovement: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createFeedback({
          ...input,
          userId: ctx.user!.id,
        });
      }),

    list: protectedProcedure
      .input(
        z
          .object({
            messageId: z.number().optional(),
            rating: z.string().optional(),
            isReviewed: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await getFeedback(input);
      }),

    review: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await updateFeedback(input.id, {
          isReviewed: true,
          reviewedBy: ctx.user.id,
          reviewNotes: input.reviewNotes,
        });
        return { success: true };
      }),
  }),

  // Enhanced Search across all sources
  enhancedSearch: router({
    query: protectedProcedure
      .input(
        z.object({
          query: z.string(),
          sources: z.array(z.enum(["knowledge", "cases", "instructions"])).optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const results = await retrieveRelevantItems(input.query, {
          sources: input.sources,
          limit: input.limit,
        });
        return results;
      }),
  }),

  // AI Advanced Tools
  aiTools: router({
    classify: protectedProcedure
      .input(
        z.object({
          text: z.string(),
          type: z.enum(["document", "ruling", "case"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await classifyDocument(input.text, input.type);
      }),

    extract: protectedProcedure
      .input(z.object({ text: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await extractInformation(input.text);
      }),

    summarize: protectedProcedure
      .input(
        z.object({
          text: z.string(),
          maxLength: z.enum(["short", "medium", "long"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await summarizeText(input.text, input.maxLength);
      }),

    extractEntities: protectedProcedure
      .input(z.object({ text: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await extractAdvancedEntities(input.text);
      }),
  }),

  // Legal Analysis Tools
  legalAnalysis: router({
    compareRulings: protectedProcedure
      .input(
        z.object({
          ruling1: z.string(),
          ruling2: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await compareRulings(input.ruling1, input.ruling2);
      }),

    analyzePrecedents: protectedProcedure
      .input(z.object({ caseDescription: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await analyzePrecedents(input.caseDescription);
      }),

    predictOutcome: protectedProcedure
      .input(
        z.object({
          caseDescription: z.string(),
          party: z.enum(["plaintiff", "defendant"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await predictCaseOutcome(input.caseDescription, input.party);
      }),

    extractTrends: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await extractJudicialTrends();
    }),

    analyzeLegalRelationships: protectedProcedure
      .input(z.object({ rulingText: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return await analyzeLegalRelationships(input.rulingText);
      }),
  }),

  // Digital Library
  digitalLibrary: router({
    list: protectedProcedure
      .input(
        z
          .object({
            type: z.string().optional(),
            category: z.string().optional(),
            search: z.string().optional(),
            dateFrom: z.date().optional(),
            dateTo: z.date().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await getDigitalLibrary(input);
      }),

    search: protectedProcedure
      .input(
        z.object({
          query: z.string(),
          types: z.array(z.string()).optional(),
          categories: z.array(z.string()).optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          propertyId: z.number().optional(),
          caseId: z.number().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .query(async ({ input }) => {
        return await advancedDocumentSearch(input);
      }),

    getLinks: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          documentType: z.enum(["ruling", "deed", "instruction"]),
        })
      )
      .query(async ({ input }) => {
        return await getDocumentLinks(input.documentId, input.documentType);
      }),

    statistics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await getLibraryStatistics();
    }),
  }),

  // Advanced Search
  advancedSearch: router({
    advanced: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
          types: z.array(z.enum(["property", "case", "ruling", "deed", "instruction", "knowledge"])).optional(),
          governorate: z.string().optional(),
          status: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { waqfProperties, waqfCases, judicialRulings, waqfDeeds, ministerialInstructions, knowledgeDocuments } = await import("../drizzle/schema");
        const { like, and, or, gte, lte, eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const results: any[] = [];
        const searchTypes = input.types || ["property", "case", "ruling", "deed", "instruction", "knowledge"];

        // Build date filters
        const dateFilters = [];
        if (input.dateFrom) {
          dateFilters.push(gte);
        }
        if (input.dateTo) {
          dateFilters.push(lte);
        }

        // Search Properties
        if (searchTypes.includes("property")) {
          const properties = await db
            .select()
            .from(waqfProperties)
            .where(eq(waqfProperties.isActive, true))
            .limit(input.limit);
          
          // Filter by search query in memory
          const filteredProperties = input.query
            ? properties.filter(p =>
                p.name?.toLowerCase().includes(input.query!.toLowerCase()) ||
                p.nationalKey?.toLowerCase().includes(input.query!.toLowerCase()) ||
                p.description?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : properties;

          results.push(
            ...filteredProperties.map((p) => ({
              id: p.id,
              type: "property" as const,
              title: p.name,
              subtitle: p.nationalKey,
              description: p.description,
              governorate: p.governorate,
              status: p.status,
              createdAt: p.createdAt,
              url: `/admin/properties/${p.id}`,
            }))
          );
        }

        // Search Cases
        if (searchTypes.includes("case")) {
          const cases = await db
            .select()
            .from(waqfCases)
            .where(eq(waqfCases.isActive, true))
            .limit(input.limit);
          
          // Filter in memory
          const filteredCases = input.query
            ? cases.filter(c =>
                c.title?.toLowerCase().includes(input.query!.toLowerCase()) ||
                c.caseNumber?.toLowerCase().includes(input.query!.toLowerCase()) ||
                c.description?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : cases;

          results.push(
            ...filteredCases.map((c) => ({
              id: c.id,
              type: "case" as const,
              title: c.title,
              subtitle: c.caseNumber,
              description: c.description,
              status: c.status,
              createdAt: c.createdAt,
              url: `/admin/cases/${c.id}`,
            }))
          );
        }

        // Search Rulings
        if (searchTypes.includes("ruling")) {
          const rulings = await db
            .select()
            .from(judicialRulings)
            .limit(input.limit);
          
          // Filter in memory
          const filteredRulings = input.query
            ? rulings.filter(r =>
                r.title?.toLowerCase().includes(input.query!.toLowerCase()) ||
                r.caseNumber?.toLowerCase().includes(input.query!.toLowerCase()) ||
                r.summary?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : rulings;

          results.push(
            ...filteredRulings.map((r) => ({
              id: r.id,
              type: "ruling" as const,
              title: r.title,
              subtitle: r.caseNumber,
              description: r.summary,
              status: r.status,
              createdAt: r.createdAt,
              url: `/admin/rulings/${r.id}`,
            }))
          );
        }

        // Search Deeds
        if (searchTypes.includes("deed")) {
          const deeds = await db
            .select()
            .from(waqfDeeds)
            .limit(input.limit);
          
          // Filter in memory
          const filteredDeeds = input.query
            ? deeds.filter(d =>
                d.waqifName?.toLowerCase().includes(input.query!.toLowerCase()) ||
                d.deedNumber?.toLowerCase().includes(input.query!.toLowerCase()) ||
                d.propertyDescription?.toLowerCase().includes(input.query!.toLowerCase()) ||
                d.summary?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : deeds;

          results.push(
            ...filteredDeeds.map((d) => ({
              id: d.id,
              type: "deed" as const,
              title: `حجة وقفية - ${d.waqifName}`,
              subtitle: d.deedNumber,
              description: d.summary || d.propertyDescription?.substring(0, 200),
              createdAt: d.createdAt,
              url: `/admin/deeds`,
            }))
          );
        }

        // Search Instructions
        if (searchTypes.includes("instruction")) {
          const instructions = await db
            .select()
            .from(ministerialInstructions)
            .where(eq(ministerialInstructions.isActive, true))
            .limit(input.limit);
          
          // Filter in memory
          const filteredInstructions = input.query
            ? instructions.filter(i =>
                i.title?.toLowerCase().includes(input.query!.toLowerCase()) ||
                i.instructionNumber?.toLowerCase().includes(input.query!.toLowerCase()) ||
                i.content?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : instructions;

          results.push(
            ...filteredInstructions.map((i) => ({
              id: i.id,
              type: "instruction" as const,
              title: i.title,
              subtitle: i.instructionNumber,
              description: i.content?.substring(0, 200),
              createdAt: i.createdAt,
              url: `/admin/instructions`,
            }))
          );
        }

        // Search Knowledge Documents
        if (searchTypes.includes("knowledge")) {
          const docs = await db
            .select()
            .from(knowledgeDocuments)
            .where(eq(knowledgeDocuments.isActive, true))
            .limit(input.limit);
          
          // Filter in memory
          const filteredDocs = input.query
            ? docs.filter(d =>
                d.title?.toLowerCase().includes(input.query!.toLowerCase()) ||
                d.content?.toLowerCase().includes(input.query!.toLowerCase())
              )
            : docs;

          results.push(
            ...filteredDocs.map((d) => ({
              id: d.id,
              type: "knowledge" as const,
              title: d.title,
              subtitle: d.category,
              description: d.content?.substring(0, 200),
              createdAt: d.createdAt,
              url: `/admin/knowledge`,
            }))
          );
        }

        // Sort by creation date (newest first)
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
          results: results.slice(0, input.limit),
          total: results.length,
        };
      }),
  }),

  // Dashboard Statistics
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const { getDb } = await import("./db");
      const { waqfProperties, waqfCases, judicialRulings, waqfDeeds, ministerialInstructions } = await import("../drizzle/schema");
      const { count } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Count totals
      const [propertiesCount] = await db.select({ count: count() }).from(waqfProperties);
      const [casesCount] = await db.select({ count: count() }).from(waqfCases);
      const [rulingsCount] = await db.select({ count: count() }).from(judicialRulings);
      const [deedsCount] = await db.select({ count: count() }).from(waqfDeeds);
      const [instructionsCount] = await db.select({ count: count() }).from(ministerialInstructions);

      // Properties by governorate
      const propertiesByGovernorate = await db
        .select({
          governorate: waqfProperties.governorate,
          count: count(),
        })
        .from(waqfProperties)
        .groupBy(waqfProperties.governorate);

      // Cases by status
      const casesByStatus = await db
        .select({
          status: waqfCases.status,
          count: count(),
        })
        .from(waqfCases)
        .groupBy(waqfCases.status);

      // Properties by type
      const propertiesByType = await db
        .select({
          propertyType: waqfProperties.propertyType,
          count: count(),
        })
        .from(waqfProperties)
        .groupBy(waqfProperties.propertyType);

      return {
        totals: {
          properties: propertiesCount?.count || 0,
          cases: casesCount?.count || 0,
          rulings: rulingsCount?.count || 0,
          deeds: deedsCount?.count || 0,
          instructions: instructionsCount?.count || 0,
        },
        propertiesByGovernorate,
        casesByStatus,
        propertiesByType,
      };
    }),
  }),

  // Site Settings Router
  siteSettings: router({
    get: publicProcedure.query(async () => {
      let settings = await getSiteSettings();
      if (!settings) {
        settings = await initializeSiteSettings();
      }
      return settings;
    }),

    update: protectedProcedure
      .input(
        z.object({
          siteName: z.string().optional(),
          siteDescription: z.string().optional(),
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          backgroundColor: z.string().optional(),
          textColor: z.string().optional(),
          accentColor: z.string().optional(),
          headingFont: z.string().optional(),
          bodyFont: z.string().optional(),
          baseFontSize: z.number().optional(),
          logoUrl: z.string().optional(),
          faviconUrl: z.string().optional(),
          menuItems: z.string().optional(),
          theme: z.enum(["light", "dark", "auto"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await updateSiteSettings({
          ...input,
          updatedBy: ctx.user.id,
        });
      }),
  }),

  // Files Router
  files: {
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(), // base64 encoded
          mimeType: z.string(),
          fileSize: z.number(),
          category: z.enum(["documents", "images", "legal", "administrative", "other"]).default("documents"),
          linkedEntityType: z.enum(["deed", "case", "property", "none"]).default("none").optional(),
          linkedEntityId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { fileName, fileData, mimeType, category } = input;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(fileData, "base64");
        const fileSize = buffer.length;
        
        // Check file size (16MB limit)
        if (fileSize > 16 * 1024 * 1024) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "حجم الملف يتجاوز الحد الأقصى (16 ميجابايت)" 
          });
        }
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = fileName.split(".").pop();
        const fileKey = `files/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, mimeType);
        
        // Save metadata to database
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        const result = await db.insert(files).values({
          fileName,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType,
          category,
          linkedEntityType: input.linkedEntityType || "none",
          linkedEntityId: input.linkedEntityId || null,
          uploadedBy: ctx.user.id,
        });
        
        // Get the inserted file
        const insertId = result[0].insertId;
        const [file] = await db.select().from(files).where(eq(files.id, insertId));
        
        return file;
      }),

    list: protectedProcedure
      .input(
        z.object({
          category: z.enum(["all", "documents", "images", "legal", "administrative", "other"]).default("all"),
        }).optional()
      )
      .query(async ({ input, ctx }) => {
        const category = input?.category || "all";
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        if (category === "all") {
          return await db
            .select()
            .from(files)
            .where(eq(files.uploadedBy, ctx.user.id))
            .orderBy(desc(files.createdAt));
        }
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        return await db
          .select()
          .from(files)
          .where(
            and(
              eq(files.uploadedBy, ctx.user.id),
              eq(files.category, category as any)
            )
          )
          .orderBy(desc(files.createdAt));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        // Get file info
        const [file] = await db
          .select()
          .from(files)
          .where(eq(files.id, input.id));
        
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });
        }
        
        // Check ownership
        if (file.uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك حذف هذا الملف" });
        }
        
        // Delete from database
        await db.delete(files).where(eq(files.id, input.id));
        
        // Note: S3 file deletion can be implemented later if needed
        // For now, we keep files in S3 for potential recovery
        
        return { success: true };
      }),

    // Link file to an entity (deed, case, or property)
    linkToEntity: protectedProcedure
      .input(z.object({
        fileId: z.number(),
        entityType: z.enum(["deed", "case", "property"]),
        entityId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        // Check file ownership
        const [file] = await db.select().from(files).where(eq(files.id, input.fileId));
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });
        }
        
        if (file.uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك تعديل هذا الملف" });
        }
        
        // Update file link
        await db.update(files)
          .set({
            linkedEntityType: input.entityType,
            linkedEntityId: input.entityId,
          })
          .where(eq(files.id, input.fileId));
        
        return { success: true };
      }),

    // Unlink file from entity
    unlinkFromEntity: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        // Check file ownership
        const [file] = await db.select().from(files).where(eq(files.id, input.fileId));
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });
        }
        
        if (file.uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك تعديل هذا الملف" });
        }
        
        // Unlink file
        await db.update(files)
          .set({
            linkedEntityType: "none",
            linkedEntityId: null,
          })
          .where(eq(files.id, input.fileId));
        
        return { success: true };
      }),

    // Get files linked to a specific entity
    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(["deed", "case", "property"]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        
        return await db
          .select()
          .from(files)
          .where(
            and(
              eq(files.linkedEntityType, input.entityType),
              eq(files.linkedEntityId, input.entityId)
            )
          )
          .orderBy(desc(files.createdAt));
      }),
  },

  // Analytics Router
  analytics: router({
    // Get rating statistics
    getRatingStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      
      // Total ratings
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRatings);
      
      // Positive ratings
      const [positiveResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRatings)
        .where(eq(messageRatings.rating, "helpful"));
      
      // Negative ratings
      const [negativeResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRatings)
        .where(eq(messageRatings.rating, "not_helpful"));
      
      const total = Number(totalResult.count) || 0;
      const positive = Number(positiveResult.count) || 0;
      const negative = Number(negativeResult.count) || 0;
      
      return {
        total,
        positive,
        negative,
        positivePercentage: total > 0 ? (positive / total * 100).toFixed(1) : "0",
        negativePercentage: total > 0 ? (negative / total * 100).toFixed(1) : "0",
      };
    }),
    
    // Analyze negative ratings
    analyzeNegativeRatings: protectedProcedure.query(async ({ ctx }) => {
      const { analyzeNegativeRatings } = await import("./learning");
      return await analyzeNegativeRatings();
    }),
    
    // Get frequent questions
    getFrequentQuestions: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const { getFrequentQuestions } = await import("./learning");
        return await getFrequentQuestions(input.limit);
      }),
    
    // Get best answers
    getBestAnswers: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const { getBestAnswers } = await import("./learning");
        return await getBestAnswers(input.limit);
      }),
    
    // Get improvement suggestions
    getImprovementSuggestions: protectedProcedure.query(async ({ ctx }) => {
      const { generateImprovementSuggestions } = await import("./learning");
      return await generateImprovementSuggestions();
    }),
  }),

  // Contact Router
  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        subject: z.string().min(5),
        message: z.string().min(10),
      }))
      .mutation(async ({ input, ctx }) => {
        await createContactMessage({
          ...input,
          userId: ctx.user?.id,
        });
        return { success: true };
      }),

    list: protectedProcedure.query(async () => {
      return await getAllContactMessages();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getContactMessageById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied"]),
      }))
      .mutation(async ({ input }) => {
        await updateContactMessageStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // Admin Panel
  admin: router({
    // System Statistics
    systemStats: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const { users, conversations, messages, faqs, knowledgeDocuments } = await import("../drizzle/schema");
      const { count, sql } = await import("drizzle-orm");

      // Total counts
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [totalConversations] = await db.select({ count: count() }).from(conversations);
      const [totalMessages] = await db.select({ count: count() }).from(messages);
      const [totalFAQs] = await db.select({ count: count() }).from(faqs);
      const [totalDocuments] = await db.select({ count: count() }).from(knowledgeDocuments);

      // Active users (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [activeUsers] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.lastSignedIn} > ${thirtyDaysAgo}`);

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [recentConversations] = await db
        .select({ count: count() })
        .from(conversations)
        .where(sql`${conversations.createdAt} > ${sevenDaysAgo}`);

      return {
        totalUsers: totalUsers.count,
        totalConversations: totalConversations.count,
        totalMessages: totalMessages.count,
        totalFAQs: totalFAQs.count,
        totalDocuments: totalDocuments.count,
        activeUsers: activeUsers.count,
        recentConversations: recentConversations.count,
      };
    }),

    // User Management
    users: router({
      list: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            role: z.enum(["admin", "user"]).optional(),
            createdAfter: z.string().optional(), // ISO date string
            createdBefore: z.string().optional(), // ISO date string
            lastSignedInAfter: z.string().optional(), // ISO date string
            lastSignedInBefore: z.string().optional(), // ISO date string
            page: z.number().default(1),
            limit: z.number().default(20),
          })
        )
        .query(async ({ input }) => {
          const { getDb } = await import("./db");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

          const { users, conversations } = await import("../drizzle/schema");
          const { eq, like, or, and, count, gte, lte } = await import("drizzle-orm");

          // Apply filters
          const conditions = [];
          if (input.search) {
            conditions.push(
              or(
                like(users.name, `%${input.search}%`),
                like(users.email, `%${input.search}%`)
              )
            );
          }
          if (input.role) {
            conditions.push(eq(users.role, input.role));
          }
          if (input.createdAfter) {
            conditions.push(gte(users.createdAt, new Date(input.createdAfter)));
          }
          if (input.createdBefore) {
            conditions.push(lte(users.createdAt, new Date(input.createdBefore)));
          }
          if (input.lastSignedInAfter) {
            conditions.push(gte(users.lastSignedIn, new Date(input.lastSignedInAfter)));
          }
          if (input.lastSignedInBefore) {
            conditions.push(lte(users.lastSignedIn, new Date(input.lastSignedInBefore)));
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          // Get total count
          const [totalCount] = await db
            .select({ count: count() })
            .from(users)
            .where(whereClause);

          // Apply pagination
          const offset = (input.page - 1) * input.limit;
          const usersList = await db
            .select()
            .from(users)
            .where(whereClause)
            .limit(input.limit)
            .offset(offset);

          // Get conversation count for each user
          const usersWithStats = await Promise.all(
            usersList.map(async (user) => {
              const [convCount] = await db
                .select({ count: count() })
                .from(conversations)
                .where(eq(conversations.userId, user.id));

              return {
                ...user,
                conversationCount: convCount.count,
              };
            })
          );

          return {
            users: usersWithStats,
            total: totalCount.count,
            page: input.page,
            limit: input.limit,
            totalPages: Math.ceil(totalCount.count / input.limit),
          };
        }),

      getById: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { users, conversations, messages } = await import("../drizzle/schema");
        const { eq, count } = await import("drizzle-orm");

        const [user] = await db.select().from(users).where(eq(users.id, input.userId));
        if (!user) return null;

        const [convCount] = await db.select({ count: count() }).from(conversations).where(eq(conversations.userId, input.userId));
        const [msgCount] = await db.select({ count: count() }).from(messages).where(eq(messages.conversationId, input.userId));

        return {
          ...user,
          conversationCount: convCount.count,
          messageCount: msgCount.count,
        };
      }),

      updateRole: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            role: z.enum(["admin", "user"]),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const { getDb } = await import("./db");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          // Prevent self-demotion
          if (input.userId === ctx.user.id && input.role === "user") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot demote yourself" });
          }

          await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

          return { success: true };
        }),

      delete: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { users, conversations, messages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Prevent self-deletion
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete yourself" });
        }

        // Delete user's messages first
        const userConversations = await db.select().from(conversations).where(eq(conversations.userId, input.userId));
        for (const conv of userConversations) {
          await db.delete(messages).where(eq(messages.conversationId, conv.id));
        }

        // Delete user's conversations
        await db.delete(conversations).where(eq(conversations.userId, input.userId));

        // Delete user
        await db.delete(users).where(eq(users.id, input.userId));

        return { success: true };
      }),
    }),

    // Activity Log
    activityLog: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          type: z.enum(["conversations", "messages", "faqs", "all"]).default("all"),
        })
      )
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { conversations, messages, faqs, users } = await import("../drizzle/schema");
        const { desc, eq } = await import("drizzle-orm");

        const activities: any[] = [];

        if (input.type === "conversations" || input.type === "all") {
          const recentConversations = await db
            .select({
              id: conversations.id,
              title: conversations.title,
              createdAt: conversations.createdAt,
              userId: conversations.userId,
              userName: users.name,
            })
            .from(conversations)
            .leftJoin(users, eq(conversations.userId, users.id))
            .orderBy(desc(conversations.createdAt))
            .limit(input.limit);

          activities.push(
            ...recentConversations.map((c) => ({
              type: "conversation",
              id: c.id,
              title: c.title,
              createdAt: c.createdAt,
              userId: c.userId,
              userName: c.userName,
            }))
          );
        }

        if (input.type === "faqs" || input.type === "all") {
          const recentFAQs = await db.select().from(faqs).orderBy(desc(faqs.createdAt)).limit(input.limit);

          activities.push(
            ...recentFAQs.map((f) => ({
              type: "faq",
              id: f.id,
              title: f.question,
              createdAt: f.createdAt,
            }))
          );
        }

        // Sort by createdAt
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return activities.slice(0, input.limit);
      }),

    // Content Management
    content: router({
      // FAQs Management
      faqs: router({
        list: adminProcedure
          .input(
            z.object({
              category: z.string().optional(),
              isActive: z.boolean().optional(),
            })
          )
          .query(async ({ input }) => {
            return await getFAQs(input);
          }),

        update: adminProcedure
          .input(
            z.object({
              id: z.number(),
              question: z.string().optional(),
              answer: z.string().optional(),
              category: z.enum(["general", "conditions", "types", "management", "legal", "jurisprudence"]).optional(),
              isActive: z.boolean().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            return await updateFAQ(id, updates);
          }),

        delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
          await deleteFAQ(input.id);
          return { success: true };
        }),
      }),

      // Knowledge Documents Management
      documents: router({
        list: adminProcedure
          .input(
            z.object({
              category: z.string().optional(),
              isActive: z.boolean().optional(),
            })
          )
          .query(async ({ input }) => {
            return await getKnowledgeDocuments(input);
          }),

        update: adminProcedure
          .input(
            z.object({
              id: z.number(),
              title: z.string().optional(),
              content: z.string().optional(),
              category: z.enum(["law", "jurisprudence", "majalla", "historical", "administrative", "reference"]).optional(),
              isActive: z.boolean().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            return await updateKnowledgeDocument(id, updates);
          }),

        delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
          await deleteKnowledgeDocument(input.id);
          return { success: true };
        }),
      }),
    }),

    // Charts Data
    charts: router({
      userGrowth: adminProcedure
        .input(z.object({ days: z.number().optional().default(30) }))
        .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { users } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        // Get user growth data for the specified days
        const daysAgo = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        
        const growthData = await db
          .select({
            date: sql<string>`DATE(${users.createdAt})`,
            count: sql<number>`COUNT(*)`
          })
          .from(users)
          .where(sql`${users.createdAt} > ${daysAgo}`)
          .groupBy(sql`DATE(${users.createdAt})`)
          .orderBy(sql`DATE(${users.createdAt})`);

        return growthData.map(item => ({
          date: item.date,
          users: Number(item.count)
        }));
      }),

      conversationActivity: adminProcedure
        .input(z.object({ days: z.number().optional().default(7) }))
        .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { conversations } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        // Get conversation activity for the specified days
        const daysAgo = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        
        const activityData = await db
          .select({
            date: sql<string>`DATE(${conversations.createdAt})`,
            count: sql<number>`COUNT(*)`
          })
          .from(conversations)
          .where(sql`${conversations.createdAt} > ${daysAgo}`)
          .groupBy(sql`DATE(${conversations.createdAt})`)
          .orderBy(sql`DATE(${conversations.createdAt})`);

        return activityData.map(item => ({
          date: item.date,
          conversations: Number(item.count)
        }));
      }),

      faqDistribution: adminProcedure.query(async () => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { faqs } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        const distributionData = await db
          .select({
            category: faqs.category,
            count: sql<number>`COUNT(*)`
          })
          .from(faqs)
          .groupBy(faqs.category);

        return distributionData.map(item => ({
          category: item.category,
          count: Number(item.count)
        }));
      }),
    }),
  }),

  // System Settings Router
  systemSettings: router({
    get: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const { systemSettings } = await import("../drizzle/schema");
      
      const [settings] = await db.select().from(systemSettings).limit(1);
      
      // If no settings exist, create default
      if (!settings) {
        await db.insert(systemSettings).values({});
        const [newSettings] = await db.select().from(systemSettings).limit(1);
        return newSettings;
      }
      
      return settings;
    }),

    update: adminProcedure
      .input(z.object({
        registrationEnabled: z.boolean().optional(),
        dailyQuestionLimit: z.number().optional(),
        requireEmailVerification: z.boolean().optional(),
        welcomeMessageEnabled: z.boolean().optional(),
        welcomeMessageTitle: z.string().optional(),
        welcomeMessageContent: z.string().optional(),
        emailEnabled: z.boolean().optional(),
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        emailFromAddress: z.string().optional(),
        emailFromName: z.string().optional(),
        maintenanceMode: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { systemSettings } = await import("../drizzle/schema");
        
        // Get existing settings
        const [existing] = await db.select().from(systemSettings).limit(1);
        
        if (existing) {
          // Update existing
          await db.update(systemSettings)
            .set({ ...input, updatedBy: ctx.user.id })
            .where(sql`id = ${existing.id}`);
        } else {
          // Create new
          await db.insert(systemSettings).values({ ...input, updatedBy: ctx.user.id });
        }
        
        return { success: true };
      }),
  }),

  // Notifications Router
  notifications: router({
    // List all notifications (admin)
    list: adminProcedure
      .input(z.object({
        status: z.enum(["draft", "scheduled", "sent", "cancelled"]).optional(),
        type: z.enum(["announcement", "update", "maintenance", "alert"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { notifications } = await import("../drizzle/schema");
        const { eq, and, count, desc } = await import("drizzle-orm");

        const conditions = [];
        if (input.status) conditions.push(eq(notifications.status, input.status));
        if (input.type) conditions.push(eq(notifications.type, input.type));
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalCount] = await db.select({ count: count() }).from(notifications).where(whereClause);
        
        const offset = (input.page - 1) * input.limit;
        const notificationsList = await db
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(desc(notifications.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          notifications: notificationsList,
          total: totalCount.count,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount.count / input.limit),
        };
      }),

    // Create notification
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(["announcement", "update", "maintenance", "alert"]),
        targetAudience: z.enum(["all", "admins", "users", "specific"]).default("all"),
        targetUserIds: z.array(z.number()).optional(),
        scheduledFor: z.date().optional(),
        status: z.enum(["draft", "scheduled", "sent"]).default("draft"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { notifications } = await import("../drizzle/schema");
        
        await db.insert(notifications).values({
          ...input,
          targetUserIds: input.targetUserIds ? JSON.stringify(input.targetUserIds) : null,
          createdBy: ctx.user.id,
        });
        
        const [notification] = await db.select().from(notifications).orderBy(sql`id DESC`).limit(1);
        return notification;
      }),

    // Update notification
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(["announcement", "update", "maintenance", "alert"]).optional(),
        targetAudience: z.enum(["all", "admins", "users", "specific"]).optional(),
        targetUserIds: z.array(z.number()).optional(),
        scheduledFor: z.date().optional(),
        status: z.enum(["draft", "scheduled", "sent", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { notifications } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        
        const { id, ...updates } = input;
        
        await db.update(notifications)
          .set({
            ...updates,
            targetUserIds: updates.targetUserIds ? JSON.stringify(updates.targetUserIds) : undefined,
          })
          .where(eq(notifications.id, id));

        return { success: true };
      }),

    // Delete notification
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { notifications } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.delete(notifications).where(eq(notifications.id, input.id));
        return { success: true };
      }),

    // Send notification immediately
    send: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { notifications, userNotifications, users } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        
        // Get notification
        const [notification] = await db.select().from(notifications).where(eq(notifications.id, input.id));
        if (!notification) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الإشعار" });
        
        // Get target users
        let targetUsers: any[] = [];
        if (notification.targetAudience === "all") {
          targetUsers = await db.select().from(users);
        } else if (notification.targetAudience === "admins") {
          targetUsers = await db.select().from(users).where(eq(users.role, "admin"));
        } else if (notification.targetAudience === "users") {
          targetUsers = await db.select().from(users).where(eq(users.role, "user"));
        } else if (notification.targetAudience === "specific" && notification.targetUserIds) {
          const ids = JSON.parse(notification.targetUserIds) as number[];
          if (ids.length > 0) {
            targetUsers = await db.select().from(users).where(sql`id IN (${ids.join(",")})`);
          }
        }
        
        // Create user notifications
        for (const user of targetUsers) {
          await db.insert(userNotifications).values({
            userId: user.id,
            notificationId: notification.id,
          });
        }
        
        // Update notification status
        await db.update(notifications)
          .set({
            status: "sent",
            sentAt: new Date(),
            sentCount: targetUsers.length,
          })
          .where(eq(notifications.id, input.id));
        
        return { success: true, sentCount: targetUsers.length };
      }),

    // Get user notifications (for regular users)
    getUserNotifications: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const { userNotifications, notifications } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      const userNotifs = await db
        .select({
          id: userNotifications.id,
          isRead: userNotifications.isRead,
          readAt: userNotifications.readAt,
          createdAt: userNotifications.createdAt,
          notification: notifications,
        })
        .from(userNotifications)
        .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
        .where(eq(userNotifications.userId, ctx.user.id))
        .orderBy(desc(userNotifications.createdAt));
      
      return userNotifs;
    }),

    // Mark notification as read
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

        const { userNotifications } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        await db.update(userNotifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(userNotifications.id, input.id),
              eq(userNotifications.userId, ctx.user.id)
            )
          );
        
        return { success: true };
      }),
  }),

  // File extraction router
  file: router({
    extractText: publicProcedure
      .input(
        z.object({
          fileData: z.string(), // base64 encoded file
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { extractTextFromFile } = await import("./fileExtractor");
        
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(input.fileData, "base64");
          const text = await extractTextFromFile(buffer, input.mimeType);
          
          return {
            success: true,
            text,
          };
        } catch (error: any) {
          console.error("File extraction error:", error);
          return {
            success: false,
            error: error.message || "فشل استخراج النص من الملف",
          };
        }
      }),
  }),
});


export type AppRouter = typeof appRouter;
