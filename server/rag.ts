import { getKnowledgeDocuments, getWaqfCases, getMinisterialInstructions } from "./db";
import { KnowledgeDocument, WaqfCase, MinisterialInstruction } from "../drizzle/schema";
import { generateEmbeddings, hybridSearch } from "./embeddings";

type SearchableItem = 
  | (KnowledgeDocument & { sourceType: 'knowledge' })
  | (WaqfCase & { sourceType: 'case' })
  | (MinisterialInstruction & { sourceType: 'instruction' });

/**
 * Calculate relevance score for knowledge documents
 */
function calculateKnowledgeRelevanceScore(query: string, document: KnowledgeDocument): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const documentText = `${document.title} ${document.content}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = document.title.toLowerCase();
  for (const term of queryTerms) {
    // Exact word match gets higher score
    const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
    if (wordBoundaryRegex.test(titleText)) {
      score += 10; // Exact match in title
    } else if (titleText.includes(term)) {
      score += 5; // Partial match
    }
  }

  // Score based on tags matches (very high weight)
  if (document.tags) {
    const tags = document.tags.toLowerCase();
    for (const term of queryTerms) {
      // Exact tag match
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (wordBoundaryRegex.test(tags)) {
        score += 15; // Exact tag match - highest priority
      } else if (tags.includes(term)) {
        score += 8; // Partial tag match
      }
    }
  }

  // Score based on content matches (with diminishing returns)
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = documentText.match(regex);
    if (matches) {
      // Diminishing returns: first 5 matches count more
      const matchCount = Math.min(matches.length, 10);
      score += matchCount > 5 ? 5 + (matchCount - 5) * 0.5 : matchCount;
    }
  }

  // Bonus for category relevance
  const categoryKeywords: Record<string, string[]> = {
    law: ["قانون", "تشريع", "نظام", "مادة"],
    jurisprudence: ["فقه", "شرع", "حكم", "فتوى"],
    majalla: ["مجلة", "عدلية", "عثماني"],
    historical: ["تاريخ", "عثماني", "وثيقة"],
    administrative: ["إدارة", "وزارة", "مجلس", "ناظر"],
  };

  const categoryTerms = categoryKeywords[document.category] || [];
  for (const term of queryTerms) {
    if (categoryTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  // Boost score for documents with multiple query terms
  const termsFound = queryTerms.filter(term => documentText.includes(term)).length;
  if (termsFound > 1) {
    score *= (1 + termsFound * 0.1); // 10% boost per additional term
  }

  // Penalize very short or very long documents
  const contentLength = document.content.length;
  if (contentLength < 100) {
    score *= 0.7; // Too short
  } else if (contentLength > 10000) {
    score *= 0.9; // Too long
  }

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate relevance score for waqf cases
 */
function calculateCaseRelevanceScore(query: string, waqfCase: WaqfCase): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const caseText = `${waqfCase.title} ${waqfCase.description} ${waqfCase.caseNumber}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = waqfCase.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleText.includes(term)) {
      score += 5;
    }
  }

  // Score based on case number exact match
  if (queryTerms.some(term => waqfCase.caseNumber.toLowerCase().includes(term))) {
    score += 10;
  }

  // Score based on content matches
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = caseText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  // Bonus for case type relevance
  const caseTypeKeywords: Record<string, string[]> = {
    ownership_dispute: ["ملكية", "نزاع", "تملك"],
    boundary_dispute: ["حدود", "حد", "تخطيط"],
    usage_violation: ["مخالفة", "استخدام", "تجاوز"],
    inheritance: ["ميراث", "ورثة", "تركة"],
    management_dispute: ["إدارة", "ناظر", "متولي"],
    encroachment: ["تعدي", "اعتداء", "احتلال"],
  };

  const caseTerms = caseTypeKeywords[waqfCase.caseType] || [];
  for (const term of queryTerms) {
    if (caseTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  return score;
}

/**
 * Calculate relevance score for ministerial instructions
 */
function calculateInstructionRelevanceScore(query: string, instruction: MinisterialInstruction): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  const instructionText = `${instruction.title} ${instruction.content} ${instruction.instructionNumber}`.toLowerCase();

  let score = 0;

  // Score based on title matches (higher weight)
  const titleText = instruction.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleText.includes(term)) {
      score += 5;
    }
  }

  // Score based on instruction number exact match
  if (queryTerms.some(term => instruction.instructionNumber.toLowerCase().includes(term))) {
    score += 10;
  }

  // Score based on content matches
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = instructionText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  // Bonus for type relevance
  const typeKeywords: Record<string, string[]> = {
    circular: ["تعميم", "منشور"],
    instruction: ["تعليمات", "توجيه"],
    decision: ["قرار", "حكم"],
    regulation: ["لائحة", "نظام"],
    guideline: ["دليل", "إرشاد"],
  };

  const typeTerms = typeKeywords[instruction.type] || [];
  for (const term of queryTerms) {
    if (typeTerms.some((catTerm) => term.includes(catTerm) || catTerm.includes(term))) {
      score += 3;
    }
  }

  return score;
}

/**
 * Retrieve relevant documents for a given query
 * Uses hybrid search (semantic + keyword-based)
 */
export async function retrieveRelevantDocuments(
  query: string,
  options?: {
    category?: string;
    limit?: number;
    minScore?: number;
    useSemanticSearch?: boolean;
  }
): Promise<Array<KnowledgeDocument & { relevanceScore: number }>> {
  const { category, limit = 5, minScore = 1, useSemanticSearch = true } = options || {};

  // Get all documents (or filtered by category)
  const documents = await getKnowledgeDocuments({
    category,
    isActive: true,
  });

  // If semantic search is disabled or no embeddings available, use keyword-only
  const hasEmbeddings = documents.some(doc => doc.embedding);
  if (!useSemanticSearch || !hasEmbeddings) {
    // Fallback to keyword-based search
    const scoredDocuments = documents
      .map((doc) => ({
        ...doc,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredDocuments;
  }

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);

    // Calculate keyword scores for all documents
    const documentsWithKeywordScores = documents.map((doc) => ({
      ...doc,
      keywordScore: calculateKnowledgeRelevanceScore(query, doc) / 100, // Normalize to 0-1
    }));

    // Perform hybrid search (70% semantic, 30% keyword)
    const hybridResults = hybridSearch(
      queryEmbedding,
      documentsWithKeywordScores,
      0.7, // Semantic weight
      limit * 2 // Get more results for filtering
    );

    // Map to expected format and filter by min score
    const scoredDocuments = hybridResults
      .map((result) => {
        // Extract the document fields and calculate final relevance score
        const { keywordScore, similarityScore, combinedScore, ...docFields } = result;
        const doc = docFields as KnowledgeDocument;
        return {
          ...doc,
          relevanceScore: combinedScore * 100, // Scale back to original range
        };
      })
      .filter((doc) => doc.relevanceScore >= minScore)
      .slice(0, limit);

    return scoredDocuments;
  } catch (error) {
    console.error("Error in semantic search, falling back to keyword search:", error);
    
    // Fallback to keyword-based search on error
    const scoredDocuments = documents
      .map((doc) => ({
        ...doc,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredDocuments;
  }
}

/**
 * Retrieve relevant items from all sources (knowledge, cases, instructions)
 */
export async function retrieveRelevantItems(
  query: string,
  options?: {
    sources?: ('knowledge' | 'cases' | 'instructions')[];
    limit?: number;
    minScore?: number;
  }
): Promise<Array<SearchableItem & { relevanceScore: number }>> {
  const { sources = ['knowledge', 'cases', 'instructions'], limit = 10, minScore = 1 } = options || {};

  const results: Array<SearchableItem & { relevanceScore: number }> = [];

  // Search in knowledge documents
  if (sources.includes('knowledge')) {
    const documents = await getKnowledgeDocuments({ isActive: true });
    const scoredDocs = documents
      .map((doc) => ({
        ...doc,
        sourceType: 'knowledge' as const,
        relevanceScore: calculateKnowledgeRelevanceScore(query, doc),
      }))
      .filter((doc) => doc.relevanceScore >= minScore);
    results.push(...scoredDocs);
  }

  // Search in waqf cases
  if (sources.includes('cases')) {
    const cases = await getWaqfCases({});
    const scoredCases = cases
      .map((waqfCase) => ({
        ...waqfCase,
        sourceType: 'case' as const,
        relevanceScore: calculateCaseRelevanceScore(query, waqfCase),
      }))
      .filter((waqfCase) => waqfCase.relevanceScore >= minScore);
    results.push(...scoredCases);
  }

  // Search in ministerial instructions
  if (sources.includes('instructions')) {
    const instructions = await getMinisterialInstructions({});
    const scoredInstructions = instructions
      .map((instruction) => ({
        ...instruction,
        sourceType: 'instruction' as const,
        relevanceScore: calculateInstructionRelevanceScore(query, instruction),
      }))
      .filter((instruction) => instruction.relevanceScore >= minScore);
    results.push(...scoredInstructions);
  }

  // Sort all results by relevance score and limit
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Extract relevant context from documents
 */
export function extractRelevantContext(
  query: string,
  documents: KnowledgeDocument[],
  maxLength: number = 3000
): string {
  if (documents.length === 0) {
    return "";
  }

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  let context = "";
  let currentLength = 0;

  for (const doc of documents) {
    if (currentLength >= maxLength) break;

    // Add document header
    const header = `\n\n## ${doc.title}\n`;
    context += header;
    currentLength += header.length;

    // Extract relevant paragraphs
    const paragraphs = doc.content.split(/\n\n+/);

    for (const paragraph of paragraphs) {
      if (currentLength >= maxLength) break;

      // Check if paragraph contains query terms
      const paragraphLower = paragraph.toLowerCase();
      const hasRelevantTerm = queryTerms.some((term) => paragraphLower.includes(term));

      if (hasRelevantTerm || paragraph.length < 200) {
        const addition = paragraph + "\n\n";
        if (currentLength + addition.length <= maxLength) {
          context += addition;
          currentLength += addition.length;
        }
      }
    }
  }

  return context.trim();
}

/**
 * Generate system prompt with retrieved context
 */
export function generateSystemPrompt(context: string): string {
  return `أنت مساعد ذكي متخصص في الأوقاف الإسلامية في فلسطين. مهمتك هي الإجابة على الأسئلة المتعلقة بالأوقاف بناءً على المعلومات المتوفرة في قاعدة المعرفة.

**تعليمات مهمة:**
1. استخدم المعلومات الموجودة في السياق أدناه للإجابة على الأسئلة
2. إذا كانت المعلومات غير كافية، أخبر المستخدم بذلك بصراحة
3. قدم إجابات دقيقة ومفصلة مع الاستشهاد بالمصادر عند الإمكان
4. استخدم اللغة العربية الفصحى الواضحة
5. نظم إجابتك بشكل منطقي ومنظم
6. عند الحديث عن القوانين، اذكر رقم القانون وتاريخه
7. عند الحديث عن الأحكام الشرعية، اذكر المصدر الفقهي

**السياق المتاح:**
${context}

**ملاحظة:** إذا سألك المستخدم عن معلومات غير موجودة في السياق أعلاه، أخبره أنك لا تملك معلومات كافية حول هذا الموضوع في قاعدة المعرفة الحالية.`;
}

/**
 * Categorize user query
 */
export function categorizeQuery(query: string): string {
  const queryLower = query.toLowerCase();

  const categories = {
    law: ["قانون", "تشريع", "نظام", "مادة", "قرار"],
    jurisprudence: ["فقه", "شرع", "حكم", "فتوى", "مذهب", "دليل"],
    majalla: ["مجلة", "عدلية", "عثماني"],
    historical: ["تاريخ", "عثماني", "وثيقة", "أرشيف"],
    administrative: ["إدارة", "وزارة", "مجلس", "ناظر", "إجراء"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => queryLower.includes(keyword))) {
      return category;
    }
  }

  return "general";
}
