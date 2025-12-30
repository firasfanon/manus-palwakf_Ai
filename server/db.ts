import { eq, desc, and, like, or, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  knowledgeDocuments,
  InsertKnowledgeDocument,
  KnowledgeDocument,
  conversations,
  InsertConversation,
  Conversation,
  messages,
  InsertMessage,
  Message,
  faqs,
  InsertFAQ,
  FAQ,
  searchLogs,
  InsertSearchLog,
  waqfProperties,
  InsertWaqfProperty,
  WaqfProperty,
  waqfCases,
  InsertWaqfCase,
  WaqfCase,
  ministerialInstructions,
  InsertMinisterialInstruction,
  MinisterialInstruction,
  feedback,
  InsertFeedback,
  documentFiles,
  InsertDocumentFile,
  DocumentFile,
  Feedback,
  learningLog,
  InsertLearningLog,
  LearningLog,
  judicialRulings,
  InsertJudicialRuling,
  JudicialRuling,
  waqfDeeds,
  InsertWaqfDeed,
  WaqfDeed,
  ottomanLandLaw,
  InsertOttomanLandLawArticle,
  OttomanLandLawArticle,
  legalPrecedents,
  InsertLegalPrecedent,
  LegalPrecedent,
  bookmarks,
  contactMessages,
  InsertBookmark,
  Bookmark,
  siteSettings,
  SiteSetting,
  InsertSiteSetting,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Knowledge Documents Functions ============

export async function createKnowledgeDocument(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(knowledgeDocuments).values(doc);
  const allDocs = await db.select().from(knowledgeDocuments).orderBy(desc(knowledgeDocuments.id)).limit(1);
  
  if (!allDocs[0]) throw new Error("Failed to create document");
  return allDocs[0];
}

export async function createKnowledgeDocument_OLD(doc: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeDocuments).values(doc);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create document");
  return inserted[0];
}

// Helper function to extract text snippet around search term
function extractSnippet(text: string, searchTerm: string, maxLength: number = 200): string {
  if (!searchTerm || !text) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);
  
  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  
  const start = Math.max(0, index - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

export async function getKnowledgeDocuments(filters?: {
  category?: string;
  isActive?: boolean;
  search?: string;
}): Promise<KnowledgeDocument[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];

  if (filters?.category) {
    conditions.push(eq(knowledgeDocuments.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(knowledgeDocuments.isActive, filters.isActive));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(knowledgeDocuments.title, `%${filters.search}%`),
        like(knowledgeDocuments.content, `%${filters.search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(knowledgeDocuments)
    .where(whereClause)
    .orderBy(desc(knowledgeDocuments.createdAt));
}

export async function getKnowledgeDocumentById(id: number): Promise<KnowledgeDocument | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id)).limit(1);
  return result[0];
}

export async function updateKnowledgeDocument(
  id: number,
  updates: Partial<InsertKnowledgeDocument>
): Promise<KnowledgeDocument | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeDocuments).set(updates).where(eq(knowledgeDocuments.id, id));

  return await getKnowledgeDocumentById(id);
}

export async function deleteKnowledgeDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
}

// ============ Conversations Functions ============

export async function createConversation(conv: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(conversations).values(conv);
  const allConvs = await db.select().from(conversations).orderBy(desc(conversations.id)).limit(1);
  
  if (!allConvs[0]) throw new Error("Failed to create conversation");
  return allConvs[0];
}

export async function createConversation_OLD(conv: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(conv);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create conversation");
  return inserted[0];
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function updateConversation(
  id: number,
  updates: Partial<InsertConversation>
): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(conversations).set(updates).where(eq(conversations.id, id));

  return await getConversationById(id);
}

// ============ Messages Functions ============

export async function createMessage(msg: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(messages).values(msg);
  const allMsgs = await db.select().from(messages).orderBy(desc(messages.id)).limit(1);
  
  if (!allMsgs[0]) throw new Error("Failed to create message");
  return allMsgs[0];
}

export async function createMessage_OLD(msg: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(msg);
  const insertId = (result as any).insertId;
  const inserted = await db
    .select()
    .from(messages)
    .where(eq(messages.id, Number(insertId || 0)))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to create message");
  return inserted[0];
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============ FAQs Functions ============

export async function createFAQ(faq: InsertFAQ): Promise<FAQ> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(faqs).values(faq);
  const allFaqs = await db.select().from(faqs).orderBy(desc(faqs.id)).limit(1);
  
  if (!allFaqs[0]) throw new Error("Failed to create FAQ");
  return allFaqs[0];
}

export async function createFAQ_OLD(faq: InsertFAQ): Promise<FAQ> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(faqs).values(faq);
  const insertId = (result as any).insertId;
  const inserted = await db.select().from(faqs).where(eq(faqs.id, Number(insertId || 0))).limit(1);

  if (!inserted[0]) throw new Error("Failed to create FAQ");
  return inserted[0];
}

export async function getFAQs(filters?: { category?: string; isActive?: boolean }): Promise<FAQ[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];

  if (filters?.category) {
    conditions.push(eq(faqs.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(faqs.isActive, filters.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db.select().from(faqs).where(whereClause).orderBy(faqs.order, desc(faqs.viewCount));
}

export async function getFAQById(id: number): Promise<FAQ | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return result[0];
}

export async function updateFAQ(id: number, updates: Partial<InsertFAQ>): Promise<FAQ | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(faqs).set(updates).where(eq(faqs.id, id));

  return await getFAQById(id);
}

export async function incrementFAQViewCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const faq = await getFAQById(id);
  if (faq) {
    await db
      .update(faqs)
      .set({ viewCount: faq.viewCount + 1 })
      .where(eq(faqs.id, id));
  }
}

export async function deleteFAQ(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(faqs).where(eq(faqs.id, id));
}

// ============ Search Logs Functions ============

export async function createSearchLog(log: InsertSearchLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(searchLogs).values(log);
}

export async function getSearchAnalytics(userId?: number) {
  const db = await getDb();
  if (!db) return { totalSearches: 0, topQueries: [] };

  let conditions = [];
  if (userId) {
    conditions.push(eq(searchLogs.userId, userId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db.select().from(searchLogs).where(whereClause);

  return {
    totalSearches: logs.length,
    topQueries: logs.slice(0, 10),
  };
}


// ============ Waqf Properties Functions ============

export async function createWaqfProperty(property: InsertWaqfProperty): Promise<WaqfProperty> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfProperties).values(property);
  const allProps = await db.select().from(waqfProperties).orderBy(desc(waqfProperties.id)).limit(1);
  
  if (!allProps[0]) throw new Error("Failed to create waqf property");
  return allProps[0];
}

export async function getWaqfProperties(filters?: {
  governorate?: string;
  propertyType?: string;
  status?: string;
  search?: string;
}): Promise<WaqfProperty[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(waqfProperties.isActive, true)];

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(waqfProperties.name, searchTerm),
        like(waqfProperties.nationalKey, searchTerm),
        like(waqfProperties.address, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(waqfProperties).where(and(...conditions)).orderBy(desc(waqfProperties.createdAt));
  return results;
}

export async function getWaqfPropertyById(id: number): Promise<WaqfProperty | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfProperties).where(eq(waqfProperties.id, id)).limit(1);
  return result[0];
}

export async function getWaqfPropertyByNationalKey(nationalKey: string): Promise<WaqfProperty | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfProperties).where(eq(waqfProperties.nationalKey, nationalKey)).limit(1);
  return result[0];
}

export async function updateWaqfProperty(id: number, updates: Partial<InsertWaqfProperty>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfProperties).set(updates).where(eq(waqfProperties.id, id));
}

export async function deleteWaqfProperty(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfProperties).set({ isActive: false }).where(eq(waqfProperties.id, id));
}

// ============ Waqf Cases Functions ============

export async function createWaqfCase(waqfCase: InsertWaqfCase): Promise<WaqfCase> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfCases).values(waqfCase);
  const allCases = await db.select().from(waqfCases).orderBy(desc(waqfCases.id)).limit(1);
  
  if (!allCases[0]) throw new Error("Failed to create waqf case");
  return allCases[0];
}

export async function getWaqfCases(filters?: {
  propertyId?: number;
  status?: string;
  caseType?: string;
  search?: string;
}): Promise<WaqfCase[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(waqfCases.isActive, true)];

  if (filters?.propertyId) {
    conditions.push(eq(waqfCases.propertyId, filters.propertyId));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(waqfCases.caseNumber, searchTerm),
        like(waqfCases.title, searchTerm),
        like(waqfCases.description, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(waqfCases).where(and(...conditions)).orderBy(desc(waqfCases.createdAt));
  return results;
}

export async function getWaqfCaseById(id: number): Promise<WaqfCase | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(waqfCases).where(eq(waqfCases.id, id)).limit(1);
  return result[0];
}

export async function updateWaqfCase(id: number, updates: Partial<InsertWaqfCase>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCases).set(updates).where(eq(waqfCases.id, id));
}

export async function deleteWaqfCase(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfCases).set({ isActive: false }).where(eq(waqfCases.id, id));
}

// ============ Ministerial Instructions Functions ============

export async function createMinisterialInstruction(instruction: InsertMinisterialInstruction): Promise<MinisterialInstruction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(ministerialInstructions).values(instruction);
  const allInstructions = await db.select().from(ministerialInstructions).orderBy(desc(ministerialInstructions.id)).limit(1);
  
  if (!allInstructions[0]) throw new Error("Failed to create ministerial instruction");
  return allInstructions[0];
}

export async function getMinisterialInstructions(filters?: {
  type?: string;
  category?: string;
  search?: string;
}): Promise<MinisterialInstruction[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(ministerialInstructions.isActive, true)];

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(ministerialInstructions.instructionNumber, searchTerm),
        like(ministerialInstructions.title, searchTerm),
        like(ministerialInstructions.content, searchTerm)
      ) as any
    );
  }

  const results = await db.select().from(ministerialInstructions).where(and(...conditions)).orderBy(desc(ministerialInstructions.issueDate));
  return results;
}

export async function getMinisterialInstructionById(id: number): Promise<MinisterialInstruction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ministerialInstructions).where(eq(ministerialInstructions.id, id)).limit(1);
  return result[0];
}

export async function updateMinisterialInstruction(id: number, updates: Partial<InsertMinisterialInstruction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ministerialInstructions).set(updates).where(eq(ministerialInstructions.id, id));
}

export async function deleteMinisterialInstruction(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ministerialInstructions).set({ isActive: false }).where(eq(ministerialInstructions.id, id));
}

// ============ Feedback Functions ============

export async function createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(feedback).values(feedbackData);
  const allFeedback = await db.select().from(feedback).orderBy(desc(feedback.id)).limit(1);
  
  if (!allFeedback[0]) throw new Error("Failed to create feedback");
  return allFeedback[0];
}

export async function getFeedback(filters?: {
  messageId?: number;
  rating?: string;
  isReviewed?: boolean;
}): Promise<Feedback[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.messageId) {
    conditions.push(eq(feedback.messageId, filters.messageId));
  }
  
  if (filters?.isReviewed !== undefined) {
    conditions.push(eq(feedback.isReviewed, filters.isReviewed));
  }

  const query = conditions.length > 0 
    ? db.select().from(feedback).where(and(...conditions))
    : db.select().from(feedback);

  const results = await query.orderBy(desc(feedback.createdAt));
  return results;
}

export async function updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(feedback).set(updates).where(eq(feedback.id, id));
}

// ============ Learning Log Functions ============

export async function createLearningLog(log: InsertLearningLog): Promise<LearningLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(learningLog).values(log);
  const allLogs = await db.select().from(learningLog).orderBy(desc(learningLog.id)).limit(1);
  
  if (!allLogs[0]) throw new Error("Failed to create learning log");
  return allLogs[0];
}

export async function getLearningLogs(filters?: {
  category?: string;
  isApplied?: boolean;
}): Promise<LearningLog[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(learningLog.category, filters.category));
  }
  
  if (filters?.isApplied !== undefined) {
    conditions.push(eq(learningLog.isApplied, filters.isApplied));
  }

  const query = conditions.length > 0 
    ? db.select().from(learningLog).where(and(...conditions))
    : db.select().from(learningLog);

  const results = await query.orderBy(desc(learningLog.createdAt));
  return results;
}

export async function updateLearningLog(id: number, updates: Partial<InsertLearningLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(learningLog).set(updates).where(eq(learningLog.id, id));
}

// ============ Judicial Rulings Functions ============

export async function getJudicialRulings(filters?: {
  court?: string;
  rulingType?: string;
  status?: string;
  search?: string;
}): Promise<JudicialRuling[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.court) {
    conditions.push(like(judicialRulings.court, `%${filters.court}%`));
  }
  
  if (filters?.rulingType) {
    conditions.push(eq(judicialRulings.rulingType, filters.rulingType as any));
  }
  
  if (filters?.status) {
    conditions.push(eq(judicialRulings.status, filters.status as any));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(judicialRulings.title, `%${filters.search}%`),
        like(judicialRulings.caseNumber, `%${filters.search}%`),
        like(judicialRulings.subject, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(judicialRulings).where(and(...conditions))
    : db.select().from(judicialRulings);

  const results = await query.orderBy(desc(judicialRulings.rulingDate));
  return results;
}

export async function getJudicialRulingById(id: number): Promise<JudicialRuling | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(judicialRulings).where(eq(judicialRulings.id, id)).limit(1);
  return results[0];
}

export async function createJudicialRuling(ruling: InsertJudicialRuling): Promise<JudicialRuling> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(judicialRulings).values(ruling);
  const allRulings = await db.select().from(judicialRulings).orderBy(desc(judicialRulings.id)).limit(1);
  
  if (!allRulings[0]) throw new Error("Failed to create judicial ruling");
  return allRulings[0];
}

export async function updateJudicialRuling(id: number, updates: Partial<InsertJudicialRuling>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(judicialRulings).set(updates).where(eq(judicialRulings.id, id));
}

export async function deleteJudicialRuling(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(judicialRulings).where(eq(judicialRulings.id, id));
}

// ============ Waqf Deeds Functions ============

export async function getWaqfDeeds(filters?: {
  waqfType?: string;
  status?: string;
  court?: string;
  search?: string;
}): Promise<WaqfDeed[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.waqfType) {
    conditions.push(eq(waqfDeeds.waqfType, filters.waqfType as any));
  }
  
  if (filters?.status) {
    conditions.push(eq(waqfDeeds.status, filters.status as any));
  }
  
  if (filters?.court) {
    conditions.push(like(waqfDeeds.court, `%${filters.court}%`));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(waqfDeeds.deedNumber, `%${filters.search}%`),
        like(waqfDeeds.waqifName, `%${filters.search}%`),
        like(waqfDeeds.propertyLocation, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(waqfDeeds).where(and(...conditions))
    : db.select().from(waqfDeeds);

  const results = await query.orderBy(desc(waqfDeeds.deedDate));
  return results;
}

export async function getWaqfDeedById(id: number): Promise<WaqfDeed | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(waqfDeeds).where(eq(waqfDeeds.id, id)).limit(1);
  return results[0];
}

export async function createWaqfDeed(deed: InsertWaqfDeed): Promise<WaqfDeed> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(waqfDeeds).values(deed);
  const allDeeds = await db.select().from(waqfDeeds).orderBy(desc(waqfDeeds.id)).limit(1);
  
  if (!allDeeds[0]) throw new Error("Failed to create waqf deed");
  return allDeeds[0];
}

export async function updateWaqfDeed(id: number, updates: Partial<InsertWaqfDeed>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waqfDeeds).set(updates).where(eq(waqfDeeds.id, id));
}

export async function deleteWaqfDeed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(waqfDeeds).where(eq(waqfDeeds.id, id));
}

// ============ Ottoman Land Law Functions ============

export async function getOttomanLandLawArticles(filters?: {
  category?: string;
  isActive?: boolean;
  search?: string;
}): Promise<OttomanLandLawArticle[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(ottomanLandLaw.category, filters.category as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(ottomanLandLaw.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(ottomanLandLaw.title, `%${filters.search}%`),
        like(ottomanLandLaw.arabicText, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(ottomanLandLaw).where(and(...conditions))
    : db.select().from(ottomanLandLaw);

  const results = await query.orderBy(ottomanLandLaw.articleNumber);
  return results;
}

export async function getOttomanLandLawArticleById(id: number): Promise<OttomanLandLawArticle | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(ottomanLandLaw).where(eq(ottomanLandLaw.id, id)).limit(1);
  return results[0];
}

export async function createOttomanLandLawArticle(article: InsertOttomanLandLawArticle): Promise<OttomanLandLawArticle> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(ottomanLandLaw).values(article);
  const allArticles = await db.select().from(ottomanLandLaw).orderBy(desc(ottomanLandLaw.id)).limit(1);
  
  if (!allArticles[0]) throw new Error("Failed to create Ottoman land law article");
  return allArticles[0];
}

export async function updateOttomanLandLawArticle(id: number, updates: Partial<InsertOttomanLandLawArticle>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ottomanLandLaw).set(updates).where(eq(ottomanLandLaw.id, id));
}

export async function deleteOttomanLandLawArticle(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(ottomanLandLaw).where(eq(ottomanLandLaw.id, id));
}

// ============ Legal Precedents Functions ============

export async function getLegalPrecedents(filters?: {
  category?: string;
  isActive?: boolean;
  search?: string;
}): Promise<LegalPrecedent[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(legalPrecedents.category, filters.category as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(legalPrecedents.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(legalPrecedents.title, `%${filters.search}%`),
        like(legalPrecedents.principle, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0 
    ? db.select().from(legalPrecedents).where(and(...conditions))
    : db.select().from(legalPrecedents);

  const results = await query.orderBy(desc(legalPrecedents.createdAt));
  return results;
}

export async function getLegalPrecedentById(id: number): Promise<LegalPrecedent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select().from(legalPrecedents).where(eq(legalPrecedents.id, id)).limit(1);
  return results[0];
}

export async function createLegalPrecedent(precedent: InsertLegalPrecedent): Promise<LegalPrecedent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(legalPrecedents).values(precedent);
  const allPrecedents = await db.select().from(legalPrecedents).orderBy(desc(legalPrecedents.id)).limit(1);
  
  if (!allPrecedents[0]) throw new Error("Failed to create legal precedent");
  return allPrecedents[0];
}

export async function updateLegalPrecedent(id: number, updates: Partial<InsertLegalPrecedent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(legalPrecedents).set(updates).where(eq(legalPrecedents.id, id));
}

export async function deleteLegalPrecedent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(legalPrecedents).where(eq(legalPrecedents.id, id));
}


// ============================================
// Bookmarks Functions
// ============================================

/**
 * إضافة مرجع إلى المفضلة
 */
export async function addBookmark(params: {
  userId: number;
  documentId: number;
  collectionName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const [result] = await db
    .insert(bookmarks)
    .values(params);
  
  return result;
}

/**
 * إزالة مرجع من المفضلة
 */
export async function removeBookmark(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.documentId, documentId)
      )
    );
  
  return { success: true };
}

/**
 * الحصول على قائمة المراجع المفضلة للمستخدم
 */
export async function getUserBookmarks(userId: number, collectionName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  let conditions = [eq(bookmarks.userId, userId)];
  
  if (collectionName) {
    conditions.push(eq(bookmarks.collectionName, collectionName));
  }

  const results = await db
    .select({
      bookmark: bookmarks,
      document: knowledgeDocuments,
    })
    .from(bookmarks)
    .innerJoin(knowledgeDocuments, eq(bookmarks.documentId, knowledgeDocuments.id))
    .where(and(...conditions))
    .orderBy(desc(bookmarks.createdAt));

  return results;
}

/**
 * التحقق إذا كان مرجع في المفضلة
 */
export async function checkBookmark(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const [result] = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.documentId, documentId)
      )
    );

  return !!result;
}

/**
 * الحصول على قائمة المجموعات
 */
export async function getUserCollections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const results = await db
    .select({
      collectionName: bookmarks.collectionName,
      count: count(),
    })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        sql`${bookmarks.collectionName} IS NOT NULL`
      )
    )
    .groupBy(bookmarks.collectionName);

  return results;
}

// Contact Messages
export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(contactMessages).values(data);
  return result;
}

export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessageById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
  return message;
}

export async function updateContactMessageStatus(id: number, status: "new" | "read" | "replied") {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
}

// ============================================
// Document Files Functions
// ============================================

/**
 * إضافة ملف PDF لمرجع
 */
export async function addDocumentFile(data: InsertDocumentFile): Promise<DocumentFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [file] = await db.insert(documentFiles).values(data);
  const created = await getDocumentFileById(file.insertId);
  if (!created) throw new Error("Failed to create document file");
  return created;
}

/**
 * الحصول على ملف بواسطة ID
 */
export async function getDocumentFileById(id: number): Promise<DocumentFile | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [file] = await db.select().from(documentFiles).where(eq(documentFiles.id, id)).limit(1);
  return file || null;
}

/**
 * الحصول على جميع ملفات مرجع
 */
export async function getDocumentFiles(documentId: number): Promise<DocumentFile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(documentFiles).where(eq(documentFiles.documentId, documentId));
}

/**
 * حذف ملف
 */
export async function deleteDocumentFile(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documentFiles).where(eq(documentFiles.id, id));
}


// ============================================
// Site Settings Functions
// ============================================

/**
 * Get site settings (returns the first/only row)
 */
export async function getSiteSettings(): Promise<SiteSetting | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.select().from(siteSettings).limit(1);
  return results[0] || null;
}

/**
 * Update site settings
 */
export async function updateSiteSettings(updates: Partial<InsertSiteSetting>): Promise<SiteSetting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if settings exist
  const existing = await getSiteSettings();
  
  if (existing) {
    // Update existing settings
    await db.update(siteSettings).set(updates).where(eq(siteSettings.id, existing.id));
    const updated = await getSiteSettings();
    if (!updated) throw new Error("Failed to update settings");
    return updated;
  } else {
    // Create new settings row
    const [result] = await db.insert(siteSettings).values(updates as InsertSiteSetting);
    const created = await getSiteSettings();
    if (!created) throw new Error("Failed to create settings");
    return created;
  }
}

/**
 * Initialize default site settings if none exist
 */
export async function initializeSiteSettings(): Promise<SiteSetting> {
  const existing = await getSiteSettings();
  if (existing) return existing;

  const defaultSettings: InsertSiteSetting = {
    siteName: "نموذج الذكاء الصناعي للأوقاف",
    siteDescription: "نموذج ذكاء صناعي شامل يستند إلى القوانين الفلسطينية، مجلة الأحكام العدلية، والمراجع الشرعية والتاريخية لتقديم استشارات دقيقة حول الأوقاف الإسلامية",
    siteLanguage: "ar",
    primaryColor: "#2563eb",
    secondaryColor: "#10b981",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    accentColor: "#f59e0b",
    headingFont: "'Cairo', sans-serif",
    bodyFont: "'Tajawal', sans-serif",
    baseFontSize: 16,
    theme: "light",
    showSocialLinks: true,
    menuItems: JSON.stringify([
      { label: "الرئيسية", href: "/" },
      { label: "المحادثة", href: "/chat" },
      { label: "قاعدة المعرفة", href: "/knowledge" },
      { label: "من نحن", href: "/about" },
      { label: "الأسئلة الشائعة", href: "/faqs" },
      { label: "اتصل بنا", href: "/contact" },
    ]),
  };

  return await updateSiteSettings(defaultSettings);
}
