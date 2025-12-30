/**
 * نظام الذكاء الصناعي المتقدم للأوقاف الإسلامية
 * يتضمن: التصنيف التلقائي، استخراج المعلومات، التلخيص الذكي
 */

import { invokeLLM } from "./_core/llm";

// ============ التصنيف التلقائي ============

export interface ClassificationResult {
  category: string;
  confidence: number;
  subcategories: string[];
  keywords: string[];
}

/**
 * تصنيف تلقائي للوثائق والقضايا
 */
export async function classifyDocument(text: string, type: "document" | "case" | "ruling"): Promise<ClassificationResult> {
  const systemPrompt = `أنت نظام تصنيف ذكي متخصص في الأوقاف الإسلامية في فلسطين.
مهمتك تصنيف النصوص إلى فئات دقيقة بناءً على محتواها.

الفئات الرئيسية للوثائق:
- قانونية: قوانين، تشريعات، أنظمة
- شرعية: فتاوى، أحكام فقهية، مراجع دينية
- إدارية: تعليمات، قرارات إدارية، مراسلات
- تاريخية: وثائق عثمانية، حجج قديمة، سجلات

الفئات الرئيسية للقضايا:
- نزاعات ملكية: خلافات على ملكية العقار الوقفي
- نزاعات إدارة: خلافات على إدارة الوقف أو النظارة
- نزاعات استحقاق: خلافات على الاستحقاق من الوقف
- نزاعات حدود: خلافات على حدود العقار
- مطالبات مالية: مطالبات بإيرادات أو تعويضات

الفئات الرئيسية للأحكام:
- أحكام صحة الوقف: التحقق من صحة الوقف
- أحكام الإدارة: تعيين نظار، عزل، صلاحيات
- أحكام التصرف: بيع، استبدال، تأجير
- أحكام الاستحقاق: تحديد المستحقين
- أحكام النزاعات: حل النزاعات بين الأطراف

قم بتحليل النص وإرجاع التصنيف بصيغة JSON.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `صنف النص التالي (نوع: ${type}):\n\n${text}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: { type: "string", description: "الفئة الرئيسية" },
            confidence: { type: "number", description: "مستوى الثقة من 0 إلى 1" },
            subcategories: { 
              type: "array", 
              items: { type: "string" },
              description: "الفئات الفرعية" 
            },
            keywords: { 
              type: "array", 
              items: { type: "string" },
              description: "الكلمات المفتاحية المستخرجة" 
            }
          },
          required: ["category", "confidence", "subcategories", "keywords"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No classification result");

  return JSON.parse(content);
}

// ============ استخراج المعلومات ============

export interface ExtractedInfo {
  entities: {
    persons: string[];
    locations: string[];
    dates: string[];
    amounts: string[];
    properties: string[];
  };
  keyPoints: string[];
  legalReferences: string[];
}

/**
 * استخراج المعلومات الهامة من النصوص
 */
export async function extractInformation(text: string): Promise<ExtractedInfo> {
  const systemPrompt = `أنت نظام استخراج معلومات متخصص في الأوقاف الإسلامية.
مهمتك استخراج المعلومات الهامة من النصوص القانونية والشرعية.

استخرج:
1. الكيانات المسماة:
   - الأشخاص: أسماء الواقفين، النظار، الأطراف، القضاة
   - الأماكن: أسماء المدن، القرى، المحافظات، العقارات
   - التواريخ: تواريخ الوقف، الأحكام، الوثائق
   - المبالغ: مبالغ مالية، إيرادات، تعويضات
   - العقارات: أوصاف العقارات، الحدود، المساحات

2. النقاط الرئيسية: أهم النقاط في النص

3. المراجع القانونية: القوانين، المواد، الأحكام المشار إليها

قم بتحليل النص وإرجاع المعلومات بصيغة JSON.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `استخرج المعلومات من النص التالي:\n\n${text}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "extracted_info",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entities: {
              type: "object",
              properties: {
                persons: { type: "array", items: { type: "string" } },
                locations: { type: "array", items: { type: "string" } },
                dates: { type: "array", items: { type: "string" } },
                amounts: { type: "array", items: { type: "string" } },
                properties: { type: "array", items: { type: "string" } }
              },
              required: ["persons", "locations", "dates", "amounts", "properties"],
              additionalProperties: false
            },
            keyPoints: { type: "array", items: { type: "string" } },
            legalReferences: { type: "array", items: { type: "string" } }
          },
          required: ["entities", "keyPoints", "legalReferences"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No extraction result");

  return JSON.parse(content);
}

// ============ التلخيص الذكي ============

export interface SummaryResult {
  shortSummary: string;
  detailedSummary: string;
  mainPoints: string[];
  conclusion: string;
}

/**
 * تلخيص ذكي للنصوص الطويلة
 */
export async function summarizeText(text: string, maxLength: "short" | "medium" | "long" = "medium"): Promise<SummaryResult> {
  const lengthGuide = {
    short: "50-100 كلمة",
    medium: "150-250 كلمة",
    long: "300-500 كلمة"
  };

  const systemPrompt = `أنت نظام تلخيص ذكي متخصص في النصوص القانونية والشرعية للأوقاف الإسلامية.
مهمتك تلخيص النصوص مع الحفاظ على المعلومات الأساسية والنقاط القانونية الهامة.

قدم:
1. ملخص قصير (2-3 جمل): الفكرة الرئيسية
2. ملخص تفصيلي (${lengthGuide[maxLength]}): شرح شامل
3. النقاط الرئيسية: قائمة بأهم النقاط
4. الخلاصة: الحكم أو القرار النهائي

احرص على:
- الدقة القانونية والشرعية
- الوضوح والإيجاز
- الحفاظ على المصطلحات القانونية
- ذكر الأطراف والتواريخ الهامة`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `لخص النص التالي:\n\n${text}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            shortSummary: { type: "string", description: "ملخص قصير 2-3 جمل" },
            detailedSummary: { type: "string", description: "ملخص تفصيلي" },
            mainPoints: { 
              type: "array", 
              items: { type: "string" },
              description: "النقاط الرئيسية" 
            },
            conclusion: { type: "string", description: "الخلاصة أو الحكم النهائي" }
          },
          required: ["shortSummary", "detailedSummary", "mainPoints", "conclusion"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No summary result");

  return JSON.parse(content);
}

// ============ استخراج الكيانات المتقدم ============

export interface AdvancedEntities {
  waqfInfo: {
    waqfName?: string;
    waqifName?: string;
    waqfType?: string;
    waqfDate?: string;
    beneficiaries?: string[];
  };
  propertyInfo: {
    location?: string;
    area?: string;
    boundaries?: string[];
    propertyType?: string;
  };
  legalInfo: {
    caseNumber?: string;
    court?: string;
    judge?: string;
    rulingDate?: string;
    parties?: string[];
  };
}

/**
 * استخراج متقدم للكيانات المتخصصة في الأوقاف
 */
export async function extractAdvancedEntities(text: string): Promise<AdvancedEntities> {
  const systemPrompt = `أنت نظام استخراج متقدم متخصص في الأوقاف الإسلامية.
استخرج المعلومات المتخصصة التالية:

معلومات الوقف:
- اسم الوقف
- اسم الواقف
- نوع الوقف (خيري، ذري، مشترك)
- تاريخ الوقف
- المستفيدون

معلومات العقار:
- الموقع
- المساحة
- الحدود
- نوع العقار

المعلومات القانونية:
- رقم القضية
- المحكمة
- القاضي
- تاريخ الحكم
- الأطراف

إذا لم تجد معلومة معينة، اتركها فارغة.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `استخرج المعلومات المتخصصة من النص:\n\n${text}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "advanced_entities",
        strict: true,
        schema: {
          type: "object",
          properties: {
            waqfInfo: {
              type: "object",
              properties: {
                waqfName: { type: "string" },
                waqifName: { type: "string" },
                waqfType: { type: "string" },
                waqfDate: { type: "string" },
                beneficiaries: { type: "array", items: { type: "string" } }
              },
              required: [],
              additionalProperties: false
            },
            propertyInfo: {
              type: "object",
              properties: {
                location: { type: "string" },
                area: { type: "string" },
                boundaries: { type: "array", items: { type: "string" } },
                propertyType: { type: "string" }
              },
              required: [],
              additionalProperties: false
            },
            legalInfo: {
              type: "object",
              properties: {
                caseNumber: { type: "string" },
                court: { type: "string" },
                judge: { type: "string" },
                rulingDate: { type: "string" },
                parties: { type: "array", items: { type: "string" } }
              },
              required: [],
              additionalProperties: false
            }
          },
          required: ["waqfInfo", "propertyInfo", "legalInfo"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No advanced entities result");

  return JSON.parse(content);
}

// ============ التعرف على الأنماط ============

export interface PatternAnalysis {
  patterns: Array<{
    type: string;
    description: string;
    frequency: number;
    examples: string[];
  }>;
  trends: string[];
  anomalies: string[];
}

/**
 * تحليل الأنماط في النصوص القانونية
 */
export async function analyzePatterns(texts: string[]): Promise<PatternAnalysis> {
  const combinedText = texts.join("\n\n---\n\n");
  
  const systemPrompt = `أنت نظام تحليل أنماط متخصص في الأوقاف الإسلامية.
حلل النصوص المقدمة واستخرج:

1. الأنماط المتكررة:
   - أنماط قانونية (صيغ، شروط، أحكام متكررة)
   - أنماط شرعية (فتاوى، استدلالات)
   - أنماط إدارية (إجراءات، قرارات)

2. الاتجاهات:
   - اتجاهات الأحكام القضائية
   - تطور التشريعات
   - تغيرات في الممارسات

3. الشذوذات:
   - حالات استثنائية
   - أحكام غير معتادة
   - قرارات مخالفة للنمط العام`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `حلل الأنماط في النصوص التالية:\n\n${combinedText}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "pattern_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  frequency: { type: "number" },
                  examples: { type: "array", items: { type: "string" } }
                },
                required: ["type", "description", "frequency", "examples"],
                additionalProperties: false
              }
            },
            trends: { type: "array", items: { type: "string" } },
            anomalies: { type: "array", items: { type: "string" } }
          },
          required: ["patterns", "trends", "anomalies"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error("No pattern analysis result");

  return JSON.parse(content);
}
