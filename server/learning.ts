/**
 * نظام التعلم من التقييمات والتحسين المستمر
 */

import { getDb } from "./db";
import { messageRatings, messages, conversations } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * تحليل التقييمات السلبية لتحديد الأنماط
 */
export async function analyzeNegativeRatings() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get all negative ratings with their messages
  const negativeRatings = await db
    .select({
      messageId: messageRatings.messageId,
      rating: messageRatings.rating,
      feedback: messageRatings.feedback,
      messageContent: messages.content,
      messageSources: messages.sources,
      conversationId: messages.conversationId,
    })
    .from(messageRatings)
    .innerJoin(messages, eq(messageRatings.messageId, messages.id))
    .where(eq(messageRatings.rating, 'not_helpful'))
    .orderBy(desc(messageRatings.createdAt))
    .limit(100);

  // Analyze patterns
  const patterns = {
    totalNegative: negativeRatings.length,
    withFeedback: negativeRatings.filter(r => r.feedback).length,
    withoutSources: negativeRatings.filter(r => !r.messageSources || r.messageSources === '[]').length,
    shortResponses: negativeRatings.filter(r => r.messageContent && r.messageContent.length < 100).length,
    commonIssues: [] as string[],
  };

  // Extract common issues from feedback
  const feedbackTexts = negativeRatings
    .filter(r => r.feedback)
    .map((r: any) => r.feedback!.toLowerCase());

  const issueKeywords = {
    'غير دقيق': ['غير دقيق', 'خطأ', 'غلط', 'مغلوط'],
    'غير كامل': ['ناقص', 'غير كامل', 'قليل', 'مختصر'],
    'لا يوجد مصادر': ['مصادر', 'مراجع', 'دليل', 'إثبات'],
    'غير واضح': ['غير واضح', 'مبهم', 'معقد', 'صعب'],
    'خارج الموضوع': ['خارج', 'غير متعلق', 'لا علاقة'],
  };

  for (const [issue, keywords] of Object.entries(issueKeywords)) {
    const count = feedbackTexts.filter(text =>
      keywords.some(keyword => text.includes(keyword))
    ).length;
    if (count > 0) {
      patterns.commonIssues.push(`${issue}: ${count} حالة`);
    }
  }

  return patterns;
}

/**
 * الحصول على الأسئلة الأكثر تكراراً
 */
export async function getFrequentQuestions(limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get user messages grouped by similar content
  const userMessages = await db
    .select({
      content: messages.content,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(messages)
    .where(eq(messages.role, 'user'))
    .groupBy(messages.content)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return userMessages;
}

/**
 * الحصول على أفضل الإجابات (بناءً على التقييمات الإيجابية)
 */
export async function getBestAnswers(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const bestAnswers = await db
    .select({
      messageId: messages.id,
      content: messages.content,
      sources: messages.sources,
      conversationId: messages.conversationId,
      positiveRatings: sql<number>`count(${messageRatings.id})`.as('positive_ratings'),
    })
    .from(messages)
    .innerJoin(messageRatings, eq(messages.id, messageRatings.messageId))
    .where(and(
      eq(messages.role, 'assistant'),
      eq(messageRatings.rating, 'helpful')
    ))
    .groupBy(messages.id, messages.content, messages.sources, messages.conversationId)
    .orderBy(desc(sql`count(${messageRatings.id})`))
    .limit(limit);

  return bestAnswers;
}

/**
 * اقتراحات لتحسين النموذج بناءً على التحليل
 */
export async function generateImprovementSuggestions() {
  const negativePatterns = await analyzeNegativeRatings();
  const suggestions: string[] = [];

  // Based on patterns, suggest improvements
  if (negativePatterns.withoutSources > negativePatterns.totalNegative * 0.3) {
    suggestions.push('زيادة عدد المصادر المسترجعة من قاعدة المعرفة');
    suggestions.push('تحسين خوارزمية البحث لإيجاد مصادر أكثر صلة');
  }

  if (negativePatterns.shortResponses > negativePatterns.totalNegative * 0.2) {
    suggestions.push('تحسين System Prompt لتشجيع إجابات أكثر تفصيلاً');
    suggestions.push('زيادة حد السياق المستخرج من الوثائق');
  }

  if (negativePatterns.commonIssues.some(issue => issue.includes('غير دقيق'))) {
    suggestions.push('مراجعة جودة المحتوى في قاعدة المعرفة');
    suggestions.push('إضافة المزيد من المراجع الموثوقة');
  }

  if (negativePatterns.commonIssues.some(issue => issue.includes('غير واضح'))) {
    suggestions.push('تحسين System Prompt لتشجيع إجابات أكثر وضوحاً');
    suggestions.push('إضافة أمثلة توضيحية في الإجابات');
  }

  return {
    patterns: negativePatterns,
    suggestions,
  };
}

/**
 * Cache للأسئلة المتكررة وإجاباتها
 */
interface CachedAnswer {
  question: string;
  answer: string;
  sources: string;
  rating: number;
  lastUsed: Date;
}

const answerCache: Map<string, CachedAnswer> = new Map();

/**
 * تطبيع السؤال للمقارنة
 */
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[؟?!.،,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * البحث في الـ cache عن إجابة مشابهة
 */
export function getCachedAnswer(question: string): CachedAnswer | null {
  const normalized = normalizeQuestion(question);

  // Exact match
  if (answerCache.has(normalized)) {
    const cached = answerCache.get(normalized)!;
    cached.lastUsed = new Date();
    return cached;
  }

  // Fuzzy match (similarity > 80%)
  const cacheEntries: Array<[string, CachedAnswer]> = [];
  answerCache.forEach((value, key) => {
    cacheEntries.push([key, value]);
  });

  for (const [cachedQ, answer] of cacheEntries) {
    const similarity = calculateSimilarity(normalized, cachedQ);
    if (similarity > 0.8) {
      answer.lastUsed = new Date();
      return answer;
    }
  }

  return null;
}

/**
 * إضافة إجابة إلى الـ cache
 */
export function cacheAnswer(question: string, answer: string, sources: string, rating: number = 0) {
  const normalized = normalizeQuestion(question);

  answerCache.set(normalized, {
    question,
    answer,
    sources,
    rating,
    lastUsed: new Date(),
  });

  // Limit cache size to 1000 entries
  if (answerCache.size > 1000) {
    // Remove oldest entries
    const entries: Array<[string, CachedAnswer]> = [];
    answerCache.forEach((value, key) => {
      entries.push([key, value]);
    });
    entries.sort((a, b) => a[1].lastUsed.getTime() - b[1].lastUsed.getTime());

    for (let i = 0; i < 100; i++) {
      answerCache.delete(entries[i][0]);
    }
  }
}

/**
 * حساب التشابه بين نصين (Jaccard similarity)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' '));
  const words2 = new Set(text2.split(' '));

  const intersection = new Set<string>();
  words1.forEach(word => {
    if (words2.has(word)) {
      intersection.add(word);
    }
  });

  const union = new Set<string>();
  words1.forEach(word => union.add(word));
  words2.forEach(word => union.add(word));

  return intersection.size / union.size;
}

/**
 * تحديث تقييم الإجابة المخزنة في الـ cache
 */
export function updateCachedAnswerRating(question: string, rating: number) {
  const normalized = normalizeQuestion(question);
  const cached = answerCache.get(normalized);

  if (cached) {
    cached.rating = rating;
  }
}

/**
 * الحصول على إحصائيات الـ cache
 */
export function getCacheStats() {
  return {
    totalCached: answerCache.size,
    highRated: Array.from(answerCache.values()).filter(a => a.rating > 0).length,
    lowRated: Array.from(answerCache.values()).filter(a => a.rating < 0).length,
  };
}
