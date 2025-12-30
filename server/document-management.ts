/**
 * نظام إدارة الوثائق المتقدم للأوقاف الإسلامية
 * يتضمن: المكتبة الرقمية، الأرشفة، ربط الوثائق، البحث المتقدم
 */

import { getDb } from "./db";
import { 
  knowledgeDocuments, 
  judicialRulings, 
  waqfDeeds, 
  ottomanLandLaw,
  ministerialInstructions,
  waqfProperties,
  waqfCases
} from "../drizzle/schema";
import { eq, and, like, or, desc } from "drizzle-orm";
import { classifyDocument, extractInformation, summarizeText } from "./ai-advanced";

// ============ المكتبة الرقمية ============

export interface DigitalLibraryItem {
  id: number;
  type: "document" | "ruling" | "deed" | "law" | "instruction";
  title: string;
  category: string;
  date: Date;
  summary?: string;
  tags?: string[];
  attachments?: string[];
}

/**
 * جلب جميع عناصر المكتبة الرقمية
 */
export async function getDigitalLibrary(filters?: {
  type?: string;
  category?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<DigitalLibraryItem[]> {
  const db = await getDb();
  if (!db) return [];

  const items: DigitalLibraryItem[] = [];

  // جلب الوثائق المعرفية
  if (!filters?.type || filters.type === "document") {
    const docs = await db
      .select()
      .from(knowledgeDocuments)
      .limit(100);
    
    items.push(...docs.map(d => ({
      id: d.id,
      type: "document" as const,
      title: d.title,
      category: d.category,
      date: d.createdAt,
      summary: undefined,
      tags: d.tags ? JSON.parse(d.tags) : undefined
    })));
  }

  // جلب الأحكام القضائية
  if (!filters?.type || filters.type === "ruling") {
    const rulings = await db
      .select()
      .from(judicialRulings)
      .limit(100);
    
    items.push(...rulings.map(r => ({
      id: r.id,
      type: "ruling" as const,
      title: r.title,
      category: r.rulingType,
      date: r.rulingDate,
      summary: r.summary || undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      attachments: r.attachments ? JSON.parse(r.attachments) : undefined
    })));
  }

  // جلب الحجج الوقفية
  if (!filters?.type || filters.type === "deed") {
    const deeds = await db
      .select()
      .from(waqfDeeds)
      .limit(100);
    
    items.push(...deeds.map(d => ({
      id: d.id,
      type: "deed" as const,
      title: `حجة وقفية رقم ${d.deedNumber}`,
      category: d.waqfType,
      date: d.deedDate,
      summary: undefined,
      tags: d.tags ? JSON.parse(d.tags) : undefined,
      attachments: d.attachments ? JSON.parse(d.attachments) : undefined
    })));
  }

  // جلب مواد قانون الأراضي العثماني
  if (!filters?.type || filters.type === "law") {
    const laws = await db
      .select()
      .from(ottomanLandLaw)
      .where(eq(ottomanLandLaw.isActive, true))
      .limit(100);
    
    items.push(...laws.map(l => ({
      id: l.id,
      type: "law" as const,
      title: `${l.title} - المادة ${l.articleNumber}`,
      category: l.category,
      date: l.createdAt,
      summary: undefined
    })));
  }

  // جلب التعليمات الوزارية
  if (!filters?.type || filters.type === "instruction") {
    const instructions = await db
      .select()
      .from(ministerialInstructions)
      .where(eq(ministerialInstructions.isActive, true))
      .limit(100);
    
    items.push(...instructions.map(i => ({
      id: i.id,
      type: "instruction" as const,
      title: i.title,
      category: i.type,
      date: i.issueDate,
      summary: undefined,
      tags: i.tags ? JSON.parse(i.tags) : undefined,
      attachments: i.attachments ? JSON.parse(i.attachments) : undefined
    })));
  }

  // تطبيق الفلاتر
  let filtered = items;

  if (filters?.category) {
    filtered = filtered.filter(item => item.category === filters.category);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.summary?.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.dateFrom) {
    filtered = filtered.filter(item => item.date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    filtered = filtered.filter(item => item.date <= filters.dateTo!);
  }

  // ترتيب حسب التاريخ (الأحدث أولاً)
  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

  return filtered;
}

// ============ نظام الأرشفة الإلكترونية ============

export interface ArchiveEntry {
  id: string;
  documentId: number;
  documentType: string;
  classification: {
    category: string;
    subcategories: string[];
  };
  metadata: {
    title: string;
    date: Date;
    author?: string;
    keywords: string[];
  };
  linkedEntities: {
    properties: number[];
    cases: number[];
    rulings: number[];
  };
  archiveLocation: string;
  accessLevel: "public" | "restricted" | "confidential";
}

/**
 * أرشفة وثيقة مع التصنيف التلقائي
 */
export async function archiveDocument(
  documentId: number,
  documentType: "document" | "ruling" | "deed" | "instruction",
  text: string
): Promise<ArchiveEntry> {
  // التصنيف التلقائي
  const mappedType = documentType === "deed" || documentType === "instruction" ? "document" : documentType;
  const classification = await classifyDocument(text, mappedType as "document" | "ruling" | "case");
  
  // استخراج المعلومات
  const extracted = await extractInformation(text);
  
  // إنشاء معرف الأرشيف
  const archiveId = `ARCH-${documentType.toUpperCase()}-${documentId}-${Date.now()}`;
  
  // تحديد موقع الأرشفة بناءً على الفئة
  const archiveLocation = `/${classification.category}/${new Date().getFullYear()}/${archiveId}`;
  
  const archiveEntry: ArchiveEntry = {
    id: archiveId,
    documentId,
    documentType,
    classification: {
      category: classification.category,
      subcategories: classification.subcategories
    },
    metadata: {
      title: extracted.keyPoints[0] || "بدون عنوان",
      date: new Date(),
      keywords: classification.keywords
    },
    linkedEntities: {
      properties: [],
      cases: [],
      rulings: []
    },
    archiveLocation,
    accessLevel: "public"
  };

  // TODO: حفظ في قاعدة البيانات
  
  return archiveEntry;
}

// ============ ربط الوثائق بالعقارات والقضايا ============

export interface DocumentLinks {
  documentId: number;
  documentType: string;
  linkedProperties: Array<{
    id: number;
    nationalKey: string;
    name: string;
  }>;
  linkedCases: Array<{
    id: number;
    caseNumber: string;
    title: string;
  }>;
  linkedRulings: Array<{
    id: number;
    caseNumber: string;
    title: string;
  }>;
}

/**
 * جلب الروابط بين الوثائق والكيانات الأخرى
 */
export async function getDocumentLinks(
  documentId: number,
  documentType: "ruling" | "deed" | "instruction"
): Promise<DocumentLinks> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const links: DocumentLinks = {
    documentId,
    documentType,
    linkedProperties: [],
    linkedCases: [],
    linkedRulings: []
  };

  // جلب الروابط حسب نوع الوثيقة
  if (documentType === "ruling") {
    const ruling = await db
      .select()
      .from(judicialRulings)
      .where(eq(judicialRulings.id, documentId))
      .limit(1);
    
    if (ruling[0]) {
      // ربط بالعقار
      if (ruling[0].propertyId) {
        const property = await db
          .select()
          .from(waqfProperties)
          .where(eq(waqfProperties.id, ruling[0].propertyId))
          .limit(1);
        
        if (property[0]) {
          links.linkedProperties.push({
            id: property[0].id,
            nationalKey: property[0].nationalKey,
            name: property[0].name
          });
        }
      }

      // ربط بالقضية
      if (ruling[0].caseId) {
        const waqfCase = await db
          .select()
          .from(waqfCases)
          .where(eq(waqfCases.id, ruling[0].caseId))
          .limit(1);
        
        if (waqfCase[0]) {
          links.linkedCases.push({
            id: waqfCase[0].id,
            caseNumber: waqfCase[0].caseNumber,
            title: waqfCase[0].title
          });
        }
      }
    }
  } else if (documentType === "deed") {
    const deed = await db
      .select()
      .from(waqfDeeds)
      .where(eq(waqfDeeds.id, documentId))
      .limit(1);
    
    if (deed[0] && deed[0].propertyId) {
      const property = await db
        .select()
        .from(waqfProperties)
        .where(eq(waqfProperties.id, deed[0].propertyId))
        .limit(1);
      
      if (property[0]) {
        links.linkedProperties.push({
          id: property[0].id,
          nationalKey: property[0].nationalKey,
          name: property[0].name
        });
      }
    }
  }

  return links;
}

// ============ البحث المتقدم في الوثائق ============

export interface AdvancedSearchParams {
  query: string;
  types?: string[];
  categories?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  propertyId?: number;
  caseId?: number;
  tags?: string[];
}

export interface SearchResult {
  item: DigitalLibraryItem;
  relevance: number;
  highlights: string[];
}

/**
 * بحث متقدم في جميع الوثائق
 */
export async function advancedDocumentSearch(params: AdvancedSearchParams): Promise<SearchResult[]> {
  const db = await getDb();
  if (!db) return [];

  const results: SearchResult[] = [];
  const searchLower = params.query.toLowerCase();

  // البحث في الوثائق المعرفية
  if (!params.types || params.types.includes("document")) {
    const docs = await db
      .select()
      .from(knowledgeDocuments)
      .where(
        or(
          like(knowledgeDocuments.title, `%${params.query}%`),
          like(knowledgeDocuments.content, `%${params.query}%`)
        )
      )
      .limit(50);
    
    for (const doc of docs) {
      const relevance = calculateRelevance(doc.title + " " + doc.content, params.query);
      const highlights = extractHighlights(doc.content, params.query);
      
      results.push({
        item: {
          id: doc.id,
          type: "document",
          title: doc.title,
          category: doc.category,
          date: doc.createdAt,
          summary: undefined
        },
        relevance,
        highlights
      });
    }
  }

  // البحث في الأحكام القضائية
  if (!params.types || params.types.includes("ruling")) {
    const rulings = await db
      .select()
      .from(judicialRulings)
      .where(
        or(
          like(judicialRulings.title, `%${params.query}%`),
          like(judicialRulings.subject, `%${params.query}%`),
          like(judicialRulings.summary, `%${params.query}%`)
        )
      )
      .limit(50);
    
    for (const ruling of rulings) {
      const relevance = calculateRelevance(ruling.title + " " + ruling.summary, params.query);
      const highlights = extractHighlights(ruling.summary, params.query);
      
      results.push({
        item: {
          id: ruling.id,
          type: "ruling",
          title: ruling.title,
          category: ruling.rulingType,
          date: ruling.rulingDate,
          summary: ruling.summary
        },
        relevance,
        highlights
      });
    }
  }

  // ترتيب حسب الصلة
  results.sort((a, b) => b.relevance - a.relevance);

  return results.slice(0, 20);
}

/**
 * حساب مدى الصلة (relevance score)
 */
function calculateRelevance(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  
  let score = 0;
  
  // عدد مرات ظهور الكلمات
  for (const word of queryWords) {
    const matches = (textLower.match(new RegExp(word, 'g')) || []).length;
    score += matches * 10;
  }
  
  // ظهور العبارة كاملة
  if (textLower.includes(queryLower)) {
    score += 50;
  }
  
  // ظهور في البداية
  if (textLower.startsWith(queryLower)) {
    score += 30;
  }
  
  return score;
}

/**
 * استخراج المقاطع البارزة من النص
 */
function extractHighlights(text: string, query: string, maxHighlights: number = 3): string[] {
  if (!text) return [];
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const highlights: string[] = [];
  
  let index = 0;
  while (highlights.length < maxHighlights) {
    const pos = textLower.indexOf(queryLower, index);
    if (pos === -1) break;
    
    // استخراج السياق (50 حرف قبل وبعد)
    const start = Math.max(0, pos - 50);
    const end = Math.min(text.length, pos + query.length + 50);
    let highlight = text.substring(start, end);
    
    if (start > 0) highlight = "..." + highlight;
    if (end < text.length) highlight = highlight + "...";
    
    highlights.push(highlight);
    index = pos + query.length;
  }
  
  return highlights;
}

// ============ إحصائيات المكتبة ============

export interface LibraryStatistics {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByCategory: Record<string, number>;
  recentAdditions: number;
  mostAccessedDocuments: Array<{
    id: number;
    title: string;
    type: string;
    accessCount: number;
  }>;
}

/**
 * جلب إحصائيات المكتبة الرقمية
 */
export async function getLibraryStatistics(): Promise<LibraryStatistics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats: LibraryStatistics = {
    totalDocuments: 0,
    documentsByType: {},
    documentsByCategory: {},
    recentAdditions: 0,
    mostAccessedDocuments: []
  };

  // عد الوثائق حسب النوع
  const docsCount = await db.select().from(knowledgeDocuments);
  const rulingsCount = await db.select().from(judicialRulings);
  const deedsCount = await db.select().from(waqfDeeds);
  const lawsCount = await db.select().from(ottomanLandLaw);
  const instructionsCount = await db.select().from(ministerialInstructions);

  stats.documentsByType = {
    documents: docsCount.length,
    rulings: rulingsCount.length,
    deeds: deedsCount.length,
    laws: lawsCount.length,
    instructions: instructionsCount.length
  };

  stats.totalDocuments = Object.values(stats.documentsByType).reduce((a, b) => a + b, 0);

  // الإضافات الحديثة (آخر 7 أيام)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentDocs = docsCount.filter(d => d.createdAt >= weekAgo);
  const recentRulings = rulingsCount.filter(r => r.createdAt >= weekAgo);
  const recentDeeds = deedsCount.filter(d => d.createdAt >= weekAgo);
  
  stats.recentAdditions = recentDocs.length + recentRulings.length + recentDeeds.length;

  return stats;
}
