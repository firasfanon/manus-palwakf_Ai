import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Knowledge base documents table
 * Stores legal documents, references, and knowledge articles about Islamic Waqf
 */
export const knowledgeDocuments = mysqlTable("knowledge_documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "law", // قوانين
    "jurisprudence", // فقه
    "majalla", // مجلة الأحكام العدلية
    "historical", // تاريخي
    "administrative", // إداري
    "reference" // مرجع
  ]).notNull(),
  source: varchar("source", { length: 500 }),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  pdfUrl: varchar("pdfUrl", { length: 1000 }), // URL to uploaded PDF file
  tags: text("tags"), // JSON array of tags
  embedding: text("embedding"), // JSON array of embedding vector (1536 dimensions)
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  titleIdx: index("title_idx").on(table.title),
}));

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

/**
 * Conversations table
 * Stores user conversations with the AI model
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  title: varchar("title", { length: 500 }),
  category: mysqlEnum("category", [
    "general", // عام
    "legal", // قانوني
    "jurisprudence", // فقهي
    "administrative", // إداري
    "historical" // تاريخي
  ]).default("general").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table
 * Stores individual messages within conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  sources: text("sources"), // JSON array of source document IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("conversation_idx").on(table.conversationId),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * FAQ table
 * Stores frequently asked questions and their answers
 */
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 1000 }).notNull(),
  answer: text("answer").notNull(),
  category: mysqlEnum("category", [
    "general", // عام
    "conditions", // شروط الوقف
    "types", // أنواع الوقف
    "management", // إدارة الوقف
    "legal", // قانوني
    "jurisprudence" // فقهي
  ]).notNull(),
  order: int("order").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  orderIdx: index("order_idx").on(table.order),
}));

export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = typeof faqs.$inferInsert;

/**
 * Search logs table
 * Tracks user searches for analytics and improvement
 */
export const searchLogs = mysqlTable("search_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  query: varchar("query", { length: 1000 }).notNull(),
  resultsCount: int("resultsCount").default(0).notNull(),
  wasHelpful: boolean("wasHelpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type SearchLog = typeof searchLogs.$inferSelect;
export type InsertSearchLog = typeof searchLogs.$inferInsert;

/**
 * Waqf Properties table
 * Stores information about waqf properties with national key identifier
 */
export const waqfProperties = mysqlTable("waqf_properties", {
  id: int("id").autoincrement().primaryKey(),
  nationalKey: varchar("nationalKey", { length: 100 }).notNull().unique(), // Pw-محافظة-مدينة-رقم-نوع
  name: varchar("name", { length: 500 }).notNull(),
  propertyType: mysqlEnum("propertyType", [
    "mosque", // مسجد
    "building", // مبنى
    "agricultural_land", // أرض زراعية
    "shrine", // مقام
    "cemetery", // مقبرة
    "school", // مدرسة
    "clinic", // عيادة
    "other" // أخرى
  ]).notNull(),
  governorate: varchar("governorate", { length: 100 }).notNull(), // المحافظة
  city: varchar("city", { length: 100 }).notNull(), // المدينة/القرية
  address: text("address"),
  area: varchar("area", { length: 100 }), // المساحة
  waqfType: mysqlEnum("waqfType", ["charitable", "family", "mixed"]).notNull(), // خيري، ذري، مختلط
  status: mysqlEnum("status", [
    "active", // نشط
    "inactive", // غير نشط
    "disputed", // متنازع عليه
    "under_development" // قيد التطوير
  ]).default("active").notNull(),
  description: text("description"),
  documents: text("documents"), // JSON array of document URLs
  coordinates: varchar("coordinates", { length: 200 }), // إحداثيات GPS
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nationalKeyIdx: index("national_key_idx").on(table.nationalKey),
  governorateIdx: index("governorate_idx").on(table.governorate),
  propertyTypeIdx: index("property_type_idx").on(table.propertyType),
  statusIdx: index("status_idx").on(table.status),
}));

export type WaqfProperty = typeof waqfProperties.$inferSelect;
export type InsertWaqfProperty = typeof waqfProperties.$inferInsert;

/**
 * Waqf Cases table
 * Stores legal cases and disputes related to waqf properties
 */
export const waqfCases = mysqlTable("waqf_cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).notNull().unique(),
  propertyId: int("propertyId").references(() => waqfProperties.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  caseType: mysqlEnum("caseType", [
    "ownership_dispute", // نزاع ملكية
    "boundary_dispute", // نزاع حدود
    "usage_violation", // مخالفة استخدام
    "inheritance", // ميراث
    "management_dispute", // نزاع إدارة
    "encroachment", // تعدي
    "other" // أخرى
  ]).notNull(),
  status: mysqlEnum("status", [
    "pending", // قيد النظر
    "under_investigation", // قيد التحقيق
    "in_court", // في المحكمة
    "resolved", // محلول
    "closed" // مغلق
  ]).default("pending").notNull(),
  court: varchar("court", { length: 200 }), // المحكمة
  judge: varchar("judge", { length: 200 }), // القاضي
  plaintiff: varchar("plaintiff", { length: 200 }), // المدعي
  defendant: varchar("defendant", { length: 200 }), // المدعى عليه
  filingDate: timestamp("filingDate"), // تاريخ رفع الدعوى
  hearingDate: timestamp("hearingDate"), // تاريخ الجلسة
  verdict: text("verdict"), // الحكم
  verdictDate: timestamp("verdictDate"), // تاريخ الحكم
  documents: text("documents"), // JSON array of document URLs
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("case_number_idx").on(table.caseNumber),
  propertyIdx: index("property_idx").on(table.propertyId),
  statusIdx: index("status_idx").on(table.status),
  caseTypeIdx: index("case_type_idx").on(table.caseType),
}));

export type WaqfCase = typeof waqfCases.$inferSelect;
export type InsertWaqfCase = typeof waqfCases.$inferInsert;

/**
 * Ministerial Instructions table
 * Stores instructions and circulars issued by the Ministry of Awqaf
 */
export const ministerialInstructions = mysqlTable("ministerial_instructions", {
  id: int("id").autoincrement().primaryKey(),
  instructionNumber: varchar("instructionNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", [
    "circular", // تعميم
    "instruction", // تعليمات
    "decision", // قرار
    "regulation", // لائحة
    "guideline" // دليل إرشادي
  ]).notNull(),
  category: mysqlEnum("category", [
    "administrative", // إداري
    "financial", // مالي
    "legal", // قانوني
    "technical", // فني
    "general" // عام
  ]).notNull(),
  issueDate: timestamp("issueDate").notNull(),
  effectiveDate: timestamp("effectiveDate"),
  expiryDate: timestamp("expiryDate"),
  issuedBy: varchar("issuedBy", { length: 200 }), // الجهة المصدرة
  attachments: text("attachments"), // JSON array of attachment URLs
  relatedInstructions: text("relatedInstructions"), // JSON array of related instruction IDs
  tags: text("tags"), // JSON array of tags
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  instructionNumberIdx: index("instruction_number_idx").on(table.instructionNumber),
  typeIdx: index("type_idx").on(table.type),
  categoryIdx: index("category_idx").on(table.category),
  issueDateIdx: index("issue_date_idx").on(table.issueDate),
}));

export type MinisterialInstruction = typeof ministerialInstructions.$inferSelect;
export type InsertMinisterialInstruction = typeof ministerialInstructions.$inferInsert;

/**
 * Feedback table
 * Stores user feedback on AI responses for learning and improvement
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").references(() => messages.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id),
  rating: mysqlEnum("rating", ["helpful", "not_helpful", "partially_helpful"]).notNull(),
  comment: text("comment"),
  suggestedImprovement: text("suggestedImprovement"),
  isReviewed: boolean("isReviewed").default(false).notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_idx").on(table.messageId),
  userIdx: index("user_idx").on(table.userId),
  ratingIdx: index("rating_idx").on(table.rating),
}));

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Learning Log table
 * Tracks improvements and learning patterns from user interactions
 */
export const learningLog = mysqlTable("learning_log", {
  id: int("id").autoincrement().primaryKey(),
  query: varchar("query", { length: 1000 }).notNull(),
  originalResponse: text("originalResponse"),
  improvedResponse: text("improvedResponse"),
  improvementReason: text("improvementReason"),
  feedbackCount: int("feedbackCount").default(0).notNull(),
  averageRating: varchar("averageRating", { length: 50 }),
  category: varchar("category", { length: 100 }),
  isApplied: boolean("isApplied").default(false).notNull(),
  appliedBy: int("appliedBy").references(() => users.id),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  isAppliedIdx: index("is_applied_idx").on(table.isApplied),
}));

export type LearningLog = typeof learningLog.$inferSelect;
export type InsertLearningLog = typeof learningLog.$inferInsert;

/**
 * Judicial rulings table
 * Stores court rulings and legal decisions related to Waqf
 */
export const judicialRulings = mysqlTable("judicial_rulings", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  court: varchar("court", { length: 200 }).notNull(), // المحكمة
  judge: varchar("judge", { length: 200 }), // القاضي
  rulingDate: timestamp("rulingDate").notNull(), // تاريخ الحكم
  rulingType: mysqlEnum("rulingType", [
    "initial", // ابتدائي
    "appeal", // استئناف
    "supreme", // عليا
    "cassation" // نقض
  ]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(), // موضوع الحكم
  summary: text("summary").notNull(), // ملخص الحكم
  fullText: text("fullText"), // النص الكامل
  legalPrinciple: text("legalPrinciple"), // المبدأ القانوني المستخلص
  relatedArticles: text("relatedArticles"), // المواد القانونية المرتبطة (JSON)
  relatedCases: text("relatedCases"), // القضايا المرتبطة (JSON)
  propertyId: int("propertyId").references(() => waqfProperties.id), // ربط بالعقار الوقفي
  caseId: int("caseId").references(() => waqfCases.id), // ربط بالقضية
  status: mysqlEnum("status", ["final", "appealable", "appealed"]).default("final").notNull(),
  tags: text("tags"), // JSON array
  attachments: text("attachments"), // JSON array of file URLs
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("case_number_idx").on(table.caseNumber),
  courtIdx: index("court_idx").on(table.court),
  rulingDateIdx: index("ruling_date_idx").on(table.rulingDate),
}));

export type JudicialRuling = typeof judicialRulings.$inferSelect;
export type InsertJudicialRuling = typeof judicialRulings.$inferInsert;

/**
 * Waqf deeds table
 * Stores historical and contemporary waqf deeds (حجج وقفية)
 */
export const waqfDeeds = mysqlTable("waqf_deeds", {
  id: int("id").autoincrement().primaryKey(),
  deedNumber: varchar("deedNumber", { length: 100 }).notNull().unique(), // رقم الحجة
  deedDate: timestamp("deedDate").notNull(), // تاريخ الحجة
  hijriDate: varchar("hijriDate", { length: 50 }), // التاريخ الهجري
  court: varchar("court", { length: 200 }).notNull(), // المحكمة الشرعية
  judge: varchar("judge", { length: 200 }), // القاضي الشرعي
  
  // بيانات الواقف
  waqifName: varchar("waqifName", { length: 300 }).notNull(), // اسم الواقف
  waqifDetails: text("waqifDetails"), // تفاصيل الواقف
  
  // بيانات العقار الموقوف
  propertyDescription: text("propertyDescription").notNull(), // وصف العقار
  propertyLocation: varchar("propertyLocation", { length: 500 }).notNull(), // موقع العقار
  propertyBoundaries: text("propertyBoundaries"), // الحدود
  propertyArea: varchar("propertyArea", { length: 100 }), // المساحة
  propertyId: int("propertyId").references(() => waqfProperties.id), // ربط بالعقار
  
  // نوع الوقف والجهة الموقوف عليها
  waqfType: mysqlEnum("waqfType", ["charitable", "family", "mixed"]).notNull(),
  beneficiaries: text("beneficiaries").notNull(), // الجهة الموقوف عليها
  
  // شروط الواقف
  waqifConditions: text("waqifConditions"), // شروط الواقف
  administratorName: varchar("administratorName", { length: 300 }), // اسم الناظر
  administratorConditions: text("administratorConditions"), // شروط النظارة
  
  // النص الكامل والوثائق
  fullText: text("fullText"), // النص الكامل للحجة
  summary: text("summary"), // ملخص الحجة
  witnesses: text("witnesses"), // الشهود (JSON)
  attachments: text("attachments"), // صور الحجة والوثائق (JSON)
  
  // الحالة والملاحظات
  status: mysqlEnum("status", ["active", "inactive", "disputed", "archived"]).default("active").notNull(),
  notes: text("notes"),
  tags: text("tags"), // JSON array
  
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  deedNumberIdx: index("deed_number_idx").on(table.deedNumber),
  deedDateIdx: index("deed_date_idx").on(table.deedDate),
  waqifNameIdx: index("waqif_name_idx").on(table.waqifName),
}));

export type WaqfDeed = typeof waqfDeeds.$inferSelect;
export type InsertWaqfDeed = typeof waqfDeeds.$inferInsert;

/**
 * Ottoman land law articles table
 * Stores articles from the Ottoman Land Law of 1858
 */
export const ottomanLandLaw = mysqlTable("ottoman_land_law", {
  id: int("id").autoincrement().primaryKey(),
  articleNumber: int("articleNumber").notNull().unique(), // رقم المادة
  title: varchar("title", { length: 500 }), // عنوان المادة
  arabicText: text("arabicText").notNull(), // النص العربي
  turkishText: text("turkishText"), // النص التركي الأصلي
  englishTranslation: text("englishTranslation"), // الترجمة الإنجليزية
  
  category: mysqlEnum("category", [
    "land_types", // أنواع الأراضي
    "ownership", // الملكية
    "waqf", // الوقف
    "inheritance", // الإرث
    "transactions", // المعاملات
    "rights", // الحقوق
    "general" // عام
  ]).notNull(),
  
  explanation: text("explanation"), // الشرح والتفسير
  relatedArticles: text("relatedArticles"), // المواد المرتبطة (JSON)
  modernApplication: text("modernApplication"), // التطبيق المعاصر
  judicialInterpretation: text("judicialInterpretation"), // التفسير القضائي
  
  isActive: boolean("isActive").default(true).notNull(), // هل المادة سارية المفعول
  tags: text("tags"), // JSON array
  
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  articleNumberIdx: index("article_number_idx").on(table.articleNumber),
  categoryIdx: index("category_idx").on(table.category),
}));

export type OttomanLandLawArticle = typeof ottomanLandLaw.$inferSelect;
export type InsertOttomanLandLawArticle = typeof ottomanLandLaw.$inferInsert;

/**
 * Legal precedents table
 * Stores legal precedents and principles extracted from rulings
 */
export const legalPrecedents = mysqlTable("legal_precedents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  principle: text("principle").notNull(), // المبدأ القانوني
  description: text("description").notNull(), // الوصف التفصيلي
  
  category: mysqlEnum("category", [
    "waqf_validity", // صحة الوقف
    "waqf_administration", // إدارة الوقف
    "waqf_termination", // انتهاء الوقف
    "property_rights", // حقوق الملكية
    "inheritance", // الإرث
    "transactions", // المعاملات
    "disputes", // النزاعات
    "general" // عام
  ]).notNull(),
  
  sourceRulingId: int("sourceRulingId").references(() => judicialRulings.id), // الحكم المصدر
  relatedRulings: text("relatedRulings"), // الأحكام المرتبطة (JSON)
  legalBasis: text("legalBasis"), // الأساس القانوني
  shariaهBasis: text("shariaBasis"), // الأساس الشرعي
  
  applicationScope: text("applicationScope"), // نطاق التطبيق
  exceptions: text("exceptions"), // الاستثناءات
  practicalImplications: text("practicalImplications"), // الآثار العملية
  
  isActive: boolean("isActive").default(true).notNull(),
  tags: text("tags"), // JSON array
  
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  titleIdx: index("title_idx").on(table.title),
}));

export type LegalPrecedent = typeof legalPrecedents.$inferSelect;
export type InsertLegalPrecedent = typeof legalPrecedents.$inferInsert;


/**
 * Bookmarks table
 * Stores user bookmarks for knowledge documents
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: int("documentId").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  collectionName: varchar("collectionName", { length: 200 }), // اسم المجموعة (اختياري)
  notes: text("notes"), // ملاحظات المستخدم
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  documentIdx: index("document_idx").on(table.documentId),
  uniqueBookmark: index("unique_bookmark").on(table.userId, table.documentId),
}));

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// Contact Messages Table
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Document Files table
 * Stores multiple PDF files for each knowledge document (original, translation, etc.)
 */
export const documentFiles = mysqlTable("document_files", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("document_id").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  fileType: mysqlEnum("file_type", [
    "original",      // الملف الأصلي
    "translation",   // ترجمة
    "supplement",    // ملحق
    "other"          // أخرى
  ]).notNull().default("original"),
  fileName: varchar("file_name", { length: 500 }),
  fileSize: int("file_size"), // in bytes
  language: varchar("language", { length: 10 }), // ar, en, etc.
  extractedText: text("extracted_text"), // Text extracted from PDF
  isOcr: boolean("is_ocr").default(false), // Whether OCR was used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  documentIdx: index("document_idx").on(table.documentId),
  fileTypeIdx: index("file_type_idx").on(table.fileType),
}));

export type DocumentFile = typeof documentFiles.$inferSelect;
export type InsertDocumentFile = typeof documentFiles.$inferInsert;


/**
 * Site Settings Table
 * Stores website configuration and customization settings
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  // General Settings
  siteName: varchar("site_name", { length: 255 }).default("نموذج الذكاء الصناعي للأوقاف").notNull(),
  siteDescription: text("site_description"),
  siteLanguage: varchar("site_language", { length: 10 }).default("ar").notNull(),
  
  // Colors
  primaryColor: varchar("primary_color", { length: 50 }).default("#2563eb"),
  secondaryColor: varchar("secondary_color", { length: 50 }).default("#10b981"),
  backgroundColor: varchar("background_color", { length: 50 }).default("#ffffff"),
  textColor: varchar("text_color", { length: 50 }).default("#1f2937"),
  accentColor: varchar("accent_color", { length: 50 }).default("#f59e0b"),
  
  // Typography
  headingFont: varchar("heading_font", { length: 255 }).default("'Cairo', sans-serif"),
  bodyFont: varchar("body_font", { length: 255 }).default("'Tajawal', sans-serif"),
  baseFontSize: int("base_font_size").default(16),
  
  // Logo and Branding
  logoUrl: varchar("logo_url", { length: 1000 }),
  faviconUrl: varchar("favicon_url", { length: 1000 }),
  
  // Navigation Menu (JSON)
  menuItems: text("menu_items"), // JSON array of menu items
  
  // Footer Settings
  footerText: text("footer_text"),
  showSocialLinks: boolean("show_social_links").default(true),
  socialLinks: text("social_links"), // JSON array of social media links
  
  // Theme
  theme: mysqlEnum("theme", ["light", "dark", "auto"]).default("light"),
  
  // Metadata
  updatedBy: int("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Files Table
 * Stores uploaded files metadata with S3 references
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileKey: varchar("file_key", { length: 1000 }).notNull(), // S3 key
  fileUrl: varchar("file_url", { length: 1000 }).notNull(), // S3 URL
  fileSize: int("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  category: mysqlEnum("category", [
    "documents",
    "images",
    "legal",
    "administrative",
    "other"
  ]).default("documents").notNull(),
  
  // Relations - link files to deeds, cases, or properties
  linkedEntityType: mysqlEnum("linked_entity_type", [
    "deed",      // حجة وقف
    "case",      // قضية
    "property",  // عقار
    "none"       // غير مرتبط
  ]).default("none"),
  linkedEntityId: int("linked_entity_id"), // ID of the linked entity
  
  uploadedBy: int("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
}));

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;


/**
 * Message Ratings Table
 * Stores user ratings for AI responses
 */
export const messageRatings = mysqlTable("message_ratings", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id),
  rating: mysqlEnum("rating", ["helpful", "not_helpful"]).notNull(),
  feedback: text("feedback"), // Optional user feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_idx").on(table.messageId),
  userIdx: index("user_idx").on(table.userId),
}));

export type MessageRating = typeof messageRatings.$inferSelect;
export type InsertMessageRating = typeof messageRatings.$inferInsert;


/**
 * Suggested Questions Table
 * Stores suggested questions for the chat interface
 */
export const suggestedQuestions = mysqlTable("suggested_questions", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  category: mysqlEnum("category", ["legal", "fiqh", "administrative", "historical"]).notNull(),
  displayOrder: int("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  activeIdx: index("active_idx").on(table.isActive),
  orderIdx: index("order_idx").on(table.displayOrder),
}));

export type SuggestedQuestion = typeof suggestedQuestions.$inferSelect;
export type InsertSuggestedQuestion = typeof suggestedQuestions.$inferInsert;

/**
 * System Settings Table
 * Stores system-wide configuration settings
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // User & Registration Settings
  registrationEnabled: boolean("registration_enabled").default(true).notNull(),
  dailyQuestionLimit: int("daily_question_limit").default(50).notNull(), // حد الأسئلة اليومية
  requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
  
  // Welcome Messages
  welcomeMessageEnabled: boolean("welcome_message_enabled").default(true).notNull(),
  welcomeMessageTitle: varchar("welcome_message_title", { length: 500 }).default("مرحباً بك في نظام الأوقاف الإسلامية"),
  welcomeMessageContent: text("welcome_message_content"),
  
  // Email Settings
  emailEnabled: boolean("email_enabled").default(false).notNull(),
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: int("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPassword: varchar("smtp_password", { length: 255 }),
  emailFromAddress: varchar("email_from_address", { length: 255 }),
  emailFromName: varchar("email_from_name", { length: 255 }),
  
  // Maintenance Mode
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  maintenanceMessage: text("maintenance_message"),
  
  // Metadata
  updatedBy: int("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Notifications Table
 * Stores system notifications sent to users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  
  // Notification Content
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", [
    "announcement",  // إعلان
    "update",        // تحديث
    "maintenance",   // صيانة
    "alert"          // تنبيه
  ]).notNull(),
  
  // Targeting
  targetAudience: mysqlEnum("target_audience", [
    "all",           // جميع المستخدمين
    "admins",        // المسؤولين فقط
    "users",         // المستخدمين العاديين فقط
    "specific"       // مستخدمين محددين
  ]).default("all").notNull(),
  targetUserIds: text("target_user_ids"), // JSON array of user IDs for specific targeting
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for"), // وقت الإرسال المجدول
  status: mysqlEnum("status", [
    "draft",         // مسودة
    "scheduled",     // مجدول
    "sent",          // تم الإرسال
    "cancelled"      // ملغي
  ]).default("draft").notNull(),
  
  // Delivery Stats
  sentCount: int("sent_count").default(0).notNull(),
  readCount: int("read_count").default(0).notNull(),
  
  // Metadata
  createdBy: int("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
  scheduledIdx: index("scheduled_idx").on(table.scheduledFor),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User Notifications Table
 * Tracks which users have read which notifications
 */
export const userNotifications = mysqlTable("user_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationId: int("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  notificationIdx: index("notification_idx").on(table.notificationId),
  readIdx: index("read_idx").on(table.isRead),
}));

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;
