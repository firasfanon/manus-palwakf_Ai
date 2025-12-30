#!/usr/bin/env tsx

/**
 * سكريبت مراقبة وتحديث FAQs الدوري
 * 
 * الوظائف:
 * 1. مراقبة المحادثات الجديدة منذ آخر تحديث
 * 2. توليد FAQs جديدة تلقائياً
 * 3. إنشاء تقرير دوري بجودة FAQs
 * 4. إرسال إشعار للمسؤول
 * 
 * الاستخدام:
 *   pnpm exec tsx scripts/monitor-and-update-faqs.mjs
 * 
 * أو للتشغيل الدوري (شهرياً):
 *   cron: 0 0 1 * * (في أول يوم من كل شهر)
 */

import { getDb, createFAQ } from "../server/db";
import { conversations, messages, faqs } from "../drizzle/schema";
import { invokeLLM } from "../server/_core/llm";
import { eq, gt, and, isNotNull, sql } from "drizzle-orm";

// ============================================================
// التكوين
// ============================================================

const CONFIG = {
  // الحد الأدنى لعدد الرسائل في المحادثة لتكون مؤهلة
  MIN_MESSAGES: 2,
  
  // الحد الأقصى لعدد FAQs الجديدة في كل تشغيل
  MAX_NEW_FAQS: 10,
  
  // عدد الأيام للنظر فيها (30 يوماً = شهر)
  DAYS_TO_CHECK: 30,
  
  // معرف المستخدم التجريبي (لتجاهله)
  TEST_USER_ID: 2580001,
};

// ============================================================
// الدوال المساعدة
// ============================================================

/**
 * الحصول على تاريخ آخر تحديث لـ FAQs
 */
async function getLastUpdateDate() {
  const db = await getDb();
  if (!db) return new Date(0);
  
  const result = await db
    .select({ maxDate: sql`MAX(${faqs.createdAt})` })
    .from(faqs)
    .limit(1);
  
  return result[0]?.maxDate || new Date(0); // إذا لم توجد FAQs، استخدم تاريخ قديم جداً
}

/**
 * الحصول على المحادثات الجديدة منذ آخر تحديث
 */
async function getNewConversations(since) {
  const cutoffDate = new Date(Date.now() - CONFIG.DAYS_TO_CHECK * 24 * 60 * 60 * 1000);
  const checkDate = since > cutoffDate ? since : cutoffDate;
  
  const db = await getDb();
  if (!db) return [];
  
  const allConversations = await db
    .select()
    .from(conversations)
    .where(
      and(
        gt(conversations.createdAt, checkDate),
        isNotNull(conversations.title),
        sql`${conversations.userId} != ${CONFIG.TEST_USER_ID}`
      )
    )
    .orderBy(conversations.createdAt);
  
  // تصفية المحادثات التي لديها عدد كافٍ من الرسائل
  const qualifiedConversations = [];
  const db2 = await getDb();
  if (!db2) return [];
  
  for (const conv of allConversations) {
    const msgs = await db2
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(messages.createdAt);
    
    if (msgs.length >= CONFIG.MIN_MESSAGES) {
      qualifiedConversations.push({
        conversation: conv,
        messages: msgs,
      });
    }
  }
  
  return qualifiedConversations;
}

/**
 * توليد FAQ من محادثة
 */
async function generateFAQFromConversation(conversationData) {
  const { conversation, messages: msgs } = conversationData;
  
  // البحث عن أول سؤال من المستخدم
  const userMessage = msgs.find(m => m.role === "user");
  if (!userMessage) return null;
  
  const question = userMessage.content.trim();
  
  // تجاهل الأسئلة القصيرة جداً أو الطويلة جداً
  if (question.length < 10 || question.length > 200) return null;
  
  // البحث عن إجابة النظام
  const assistantMessage = msgs.find(m => m.role === "assistant");
  if (!assistantMessage) return null;
  
  // التحقق من عدم وجود FAQ مماثل
  const db = await getDb();
  if (!db) return null;
  
  const existingFAQs = await db
    .select()
    .from(faqs)
    .where(sql`${faqs.question} LIKE ${`%${question.substring(0, 20)}%`}`)
    .limit(1);
  
  if (existingFAQs.length > 0) {
    return null; // FAQ موجود بالفعل
  }
  
  // تحديد الفئة تلقائياً باستخدام LLM
  const categoryPrompt = `
حدد الفئة المناسبة للسؤال التالي. اختر واحدة فقط من هذه الفئات:
- general (عام)
- conditions (شروط الوقف)
- types (أنواع الوقف)
- management (إدارة الوقف)
- legal (قانوني)
- jurisprudence (فقهي)

السؤال: "${question}"

أجب بكلمة واحدة فقط (الفئة بالإنجليزية).
  `.trim();
  
  try {
    const categoryResponse = await invokeLLM({
      messages: [
        { role: "system", content: "أنت مساعد متخصص في تصنيف الأسئلة المتعلقة بالأوقاف الإسلامية." },
        { role: "user", content: categoryPrompt },
      ],
    });
    
    const category = categoryResponse.choices[0].message.content.trim().toLowerCase();
    
    // التحقق من صحة الفئة
    const validCategories = ["general", "conditions", "types", "management", "legal", "jurisprudence"];
    const finalCategory = validCategories.includes(category) ? category : "general";
    
    return {
      question,
      answer: assistantMessage.content,
      category: finalCategory,
    };
  } catch (error) {
    console.error(`❌ Error generating FAQ for conversation ${conversation.id}:`, error.message);
    return null;
  }
}

/**
 * حفظ FAQ في قاعدة البيانات
 */
async function saveFAQ(faqData) {
  try {
    await createFAQ({
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      isActive: true,
    });
    return true;
  } catch (error) {
    console.error(`❌ Error saving FAQ:`, error.message);
    return false;
  }
}

/**
 * إنشاء تقرير دوري
 */
async function generateReport(stats) {
  const report = `
============================================================
📊 تقرير تحديث FAQs الدوري
============================================================
التاريخ: ${new Date().toLocaleString('ar-EG')}
الفترة: آخر ${CONFIG.DAYS_TO_CHECK} يوماً

📈 الإحصائيات:
------------------------------------------------------------
- المحادثات الجديدة: ${stats.totalConversations}
- المحادثات المؤهلة: ${stats.qualifiedConversations}
- FAQs تم توليدها: ${stats.faqsCreated}
- FAQs فشلت: ${stats.faqsFailed}
- FAQs موجودة مسبقاً: ${stats.faqsSkipped}

📊 التفاصيل:
------------------------------------------------------------
${stats.details.map((d, i) => `${i + 1}. ${d}`).join('\n')}

✅ الحالة النهائية:
------------------------------------------------------------
- إجمالي FAQs في النظام: ${stats.totalFAQsInSystem}
- آخر تحديث: ${stats.lastUpdateDate.toLocaleString('ar-EG')}

${stats.faqsCreated > 0 ? '🎉 تم تحديث FAQs بنجاح!' : '⚠️  لا توجد FAQs جديدة للإضافة.'}
============================================================
  `.trim();
  
  return report;
}

// ============================================================
// الدالة الرئيسية
// ============================================================

async function main() {
  console.log("🚀 بدء مراقبة وتحديث FAQs...\n");
  
  const stats = {
    totalConversations: 0,
    qualifiedConversations: 0,
    faqsCreated: 0,
    faqsFailed: 0,
    faqsSkipped: 0,
    details: [],
    lastUpdateDate: new Date(),
    totalFAQsInSystem: 0,
  };
  
  try {
    // 1. الحصول على تاريخ آخر تحديث
    const lastUpdate = await getLastUpdateDate();
    console.log(`📅 آخر تحديث: ${lastUpdate.toLocaleString('ar-EG')}\n`);
    
    // 2. الحصول على المحادثات الجديدة
    console.log("🔍 البحث عن محادثات جديدة...");
    const newConversations = await getNewConversations(lastUpdate);
    stats.totalConversations = newConversations.length;
    stats.qualifiedConversations = newConversations.length;
    
    console.log(`✅ وجدت ${newConversations.length} محادثة مؤهلة\n`);
    
    if (newConversations.length === 0) {
      console.log("⚠️  لا توجد محادثات جديدة للمعالجة.\n");
      
      // الحصول على إجمالي FAQs
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const allFAQs = await db.select().from(faqs);
      stats.totalFAQsInSystem = allFAQs.length;
      stats.lastUpdateDate = lastUpdate;
      
      const report = await generateReport(stats);
      console.log(report);
      return;
    }
    
    // 3. توليد FAQs من المحادثات
    console.log("🤖 توليد FAQs من المحادثات...\n");
    
    let processedCount = 0;
    for (const convData of newConversations) {
      if (processedCount >= CONFIG.MAX_NEW_FAQS) {
        console.log(`⚠️  تم الوصول إلى الحد الأقصى (${CONFIG.MAX_NEW_FAQS} FAQs)\n`);
        break;
      }
      
      const { conversation } = convData;
      console.log(`📝 معالجة محادثة: "${conversation.title}"`);
      
      const faqData = await generateFAQFromConversation(convData);
      
      if (!faqData) {
        console.log(`   ⏭️  تخطي (غير مؤهل أو موجود مسبقاً)`);
        stats.faqsSkipped++;
        stats.details.push(`تخطي: "${conversation.title}"`);
        continue;
      }
      
      const saved = await saveFAQ(faqData);
      
      if (saved) {
        console.log(`   ✅ تم إنشاء FAQ: "${faqData.question.substring(0, 50)}..."`);
        stats.faqsCreated++;
        stats.details.push(`إنشاء: "${faqData.question.substring(0, 50)}..." [${faqData.category}]`);
        processedCount++;
      } else {
        console.log(`   ❌ فشل حفظ FAQ`);
        stats.faqsFailed++;
        stats.details.push(`فشل: "${conversation.title}"`);
      }
    }
    
    // 4. الحصول على إجمالي FAQs
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allFAQs = await db.select().from(faqs);
    stats.totalFAQsInSystem = allFAQs.length;
    stats.lastUpdateDate = new Date();
    
    // 5. إنشاء التقرير
    console.log("\n");
    const report = await generateReport(stats);
    console.log(report);
    
    // 6. حفظ التقرير في ملف
    const fs = await import('fs/promises');
    const reportPath = `/home/ubuntu/waqf_ai_model/reports/faq-update-${Date.now()}.txt`;
    await fs.mkdir('/home/ubuntu/waqf_ai_model/reports', { recursive: true });
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`\n📄 تم حفظ التقرير في: ${reportPath}`);
    
  } catch (error) {
    console.error("\n❌ خطأ في تشغيل السكريبت:", error);
    process.exit(1);
  }
}

// تشغيل السكريبت
main()
  .then(() => {
    console.log("\n✅ اكتمل التشغيل بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ خطأ غير متوقع:", error);
    process.exit(1);
  });
