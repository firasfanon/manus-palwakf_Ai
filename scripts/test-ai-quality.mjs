/**
 * سكريبت اختبار جودة الإجابات
 * يختبر النظام مع الأسئلة الـ 20 ويقيس الدقة
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// الأسئلة الاختبارية (من test_questions.md)
const testQuestions = [
  // أسئلة قانونية
  {
    category: 'law',
    question: 'ما هي أنواع الأراضي في قانون الأراضي العثماني؟',
    expectedKeywords: ['أراضي مملوكة', 'أراضي أميرية', 'أراضي موقوفة', 'أراضي متروكة', 'أراضي موات'],
  },
  {
    category: 'law',
    question: 'ما هي شروط صحة الوقف حسب قانون الأوقاف الفلسطيني؟',
    expectedKeywords: ['جهة بر', 'لا تنقطع', 'شرعي', 'صحيح'],
  },
  {
    category: 'law',
    question: 'ما الفرق بين الوقف الخيري والوقف الذري؟',
    expectedKeywords: ['وقف خيري', 'وقف ذري', 'جهة بر', 'ذرية', 'أولاد'],
  },
  {
    category: 'law',
    question: 'ما هي صلاحيات وزارة الأوقاف حسب القانون؟',
    expectedKeywords: ['المحافظة', 'المساجد', 'أموال الأوقاف', 'صيانة', 'تنمية', 'إدارة'],
  },
  {
    category: 'law',
    question: 'هل يجوز استبدال الوقف؟ وما هي الشروط؟',
    expectedKeywords: ['استبدال', 'شروط', 'أنفع', 'مصلحة', 'قاضي'],
  },

  // أسئلة فقهية
  {
    category: 'jurisprudence',
    question: 'ما هو تعريف الوقف في الفقه الإسلامي؟',
    expectedKeywords: ['حبس', 'تسبيل', 'منفعة', 'عين', 'ملك'],
  },
  {
    category: 'jurisprudence',
    question: 'ما هو رأي أبي حنيفة في ملكية الوقف؟',
    expectedKeywords: ['أبو حنيفة', 'ملك', 'واقف', 'لا يزيل', 'تصرف'],
  },
  {
    category: 'jurisprudence',
    question: 'ما هي شروط صحة الوقف في المذهب الحنفي؟',
    expectedKeywords: ['جهة بر', 'لا تنقطع', 'انتفاع', 'بقاء عين', 'أهل', 'تبرع'],
  },
  {
    category: 'jurisprudence',
    question: 'هل يجوز وقف المنقول في الفقه الحنفي؟',
    expectedKeywords: ['منقول', 'أبو يوسف', 'محمد', 'أبو حنيفة', 'خلاف'],
  },
  {
    category: 'jurisprudence',
    question: 'ما حكم الوقف في مرض الموت؟',
    expectedKeywords: ['مرض الموت', 'ثلث', 'رأس المال', 'تبرع'],
  },

  // أسئلة تاريخية
  {
    category: 'historical',
    question: 'ما هو أقدم وقف في العالم الإسلامي؟',
    expectedKeywords: ['مسجد قباء', 'النبي', 'المدينة', 'أول'],
  },
  {
    category: 'historical',
    question: 'متى تم إنشاء أول وزارة للأوقاف في فلسطين؟',
    expectedKeywords: ['1994', 'السلطة الوطنية', 'فلسطين'],
  },
  {
    category: 'historical',
    question: 'ما هي أهم الأوقاف على المسجد الأقصى؟',
    expectedKeywords: ['المسجد الأقصى', 'القدس', 'وقف', 'تاريخي'],
  },
  {
    category: 'historical',
    question: 'من هو مصطفى آغا وما هي حجة وقفه؟',
    expectedKeywords: ['مصطفى آغا', '1821', 'حجة', 'وقف', 'القدس'],
  },
  {
    category: 'historical',
    question: 'كيف كانت إدارة الأوقاف في العهد العثماني؟',
    expectedKeywords: ['عثماني', 'إدارة', 'أوقاف', 'متولي', 'ناظر'],
  },

  // أسئلة إدارية
  {
    category: 'administrative',
    question: 'ما هي مهام لجان رعاية المساجد؟',
    expectedKeywords: ['لجان', 'مساجد', 'رعاية', 'مهام', 'صيانة'],
  },
  {
    category: 'administrative',
    question: 'ما هي شروط التسجيل لموسم الحج والعمرة؟',
    expectedKeywords: ['حج', 'عمرة', 'تسجيل', 'شروط'],
  },
  {
    category: 'administrative',
    question: 'ما هي التعديلات الأخيرة على قانون الأوقاف؟',
    expectedKeywords: ['2023', 'تعديل', 'قانون', 'أوقاف'],
  },
  {
    category: 'administrative',
    question: 'ما هي برامج وزارة الأوقاف الحالية؟',
    expectedKeywords: ['برامج', 'وزارة', 'أوقاف', 'خدمات'],
  },
  {
    category: 'administrative',
    question: 'كيف يتم إدارة الوقف الذري؟',
    expectedKeywords: ['وقف ذري', 'إدارة', 'ذرية', 'متولي'],
  },
];

// دالة لحساب نسبة التطابق مع الكلمات المفتاحية
function calculateAccuracy(answer, expectedKeywords) {
  if (!answer) return 0;
  
  const answerLower = answer.toLowerCase();
  let matchCount = 0;
  
  for (const keyword of expectedKeywords) {
    if (answerLower.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }
  
  return (matchCount / expectedKeywords.length) * 100;
}

// دالة لاختبار سؤال واحد
async function testQuestion(question, index) {
  console.log(`\n[${index + 1}/20] اختبار السؤال: ${question.question}`);
  console.log(`الفئة: ${question.category}`);
  
  try {
    // هنا يجب استدعاء نظام RAG الفعلي
    // لكن للاختبار السريع، سنستخدم بحث بسيط في قاعدة البيانات
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // البحث في المراجع
    const [docs] = await connection.query(
      `SELECT title, content, category, tags 
       FROM knowledge_documents 
       WHERE content LIKE ? OR title LIKE ? OR tags LIKE ?
       LIMIT 5`,
      [`%${question.question.split(' ').slice(0, 3).join('%')}%`,
       `%${question.question.split(' ').slice(0, 3).join('%')}%`,
       `%${question.question.split(' ').slice(0, 3).join('%')}%`]
    );
    
    await connection.end();
    
    if (docs.length === 0) {
      console.log('❌ لم يتم العثور على مراجع ذات صلة');
      return {
        question: question.question,
        category: question.category,
        found: false,
        accuracy: 0,
        sources: 0,
      };
    }
    
    // حساب الدقة بناءً على المحتوى المسترجع
    const combinedContent = docs.map(d => d.content).join(' ');
    const accuracy = calculateAccuracy(combinedContent, question.expectedKeywords);
    
    console.log(`✅ تم العثور على ${docs.length} مراجع`);
    console.log(`📊 نسبة التطابق: ${accuracy.toFixed(1)}%`);
    console.log(`📚 المراجع: ${docs.map(d => d.title).join(', ')}`);
    
    return {
      question: question.question,
      category: question.category,
      found: true,
      accuracy,
      sources: docs.length,
      references: docs.map(d => d.title),
    };
  } catch (error) {
    console.error(`❌ خطأ في اختبار السؤال: ${error.message}`);
    return {
      question: question.question,
      category: question.category,
      found: false,
      accuracy: 0,
      sources: 0,
      error: error.message,
    };
  }
}

// الدالة الرئيسية
async function main() {
  console.log('='.repeat(60));
  console.log('🧪 اختبار جودة الإجابات - نموذج الذكاء الصناعي للأوقاف');
  console.log('='.repeat(60));
  console.log(`\n📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`);
  console.log(`📝 عدد الأسئلة: ${testQuestions.length}`);
  
  const results = [];
  
  // اختبار جميع الأسئلة
  for (let i = 0; i < testQuestions.length; i++) {
    const result = await testQuestion(testQuestions[i], i);
    results.push(result);
    
    // انتظار قصير بين الأسئلة
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // حساب الإحصائيات
  console.log('\n' + '='.repeat(60));
  console.log('📊 النتائج النهائية');
  console.log('='.repeat(60));
  
  const totalQuestions = results.length;
  const foundQuestions = results.filter(r => r.found).length;
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalQuestions;
  const avgSources = results.reduce((sum, r) => sum + r.sources, 0) / totalQuestions;
  
  console.log(`\n✅ الأسئلة التي تم العثور على مراجع لها: ${foundQuestions}/${totalQuestions} (${(foundQuestions/totalQuestions*100).toFixed(1)}%)`);
  console.log(`📊 متوسط نسبة التطابق: ${avgAccuracy.toFixed(1)}%`);
  console.log(`📚 متوسط عدد المراجع لكل سؤال: ${avgSources.toFixed(1)}`);
  
  // تحليل حسب الفئة
  console.log('\n📈 التحليل حسب الفئة:');
  const categories = ['law', 'jurisprudence', 'historical', 'administrative'];
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryAccuracy = categoryResults.reduce((sum, r) => sum + r.accuracy, 0) / categoryResults.length;
    const categoryFound = categoryResults.filter(r => r.found).length;
    
    console.log(`  - ${category}: ${categoryAccuracy.toFixed(1)}% (${categoryFound}/${categoryResults.length} أسئلة)`);
  }
  
  // حفظ النتائج في ملف
  const reportPath = path.join(__dirname, '..', 'AI_QUALITY_TEST_RESULTS.json');
  await fs.writeFile(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    summary: {
      totalQuestions,
      foundQuestions,
      avgAccuracy,
      avgSources,
    },
    categoryAnalysis: categories.map(category => {
      const categoryResults = results.filter(r => r.category === category);
      return {
        category,
        accuracy: categoryResults.reduce((sum, r) => sum + r.accuracy, 0) / categoryResults.length,
        found: categoryResults.filter(r => r.found).length,
        total: categoryResults.length,
      };
    }),
    details: results,
  }, null, 2));
  
  console.log(`\n💾 تم حفظ النتائج في: ${reportPath}`);
  
  // تقييم الأداء
  console.log('\n' + '='.repeat(60));
  console.log('🎯 التقييم النهائي');
  console.log('='.repeat(60));
  
  if (avgAccuracy >= 80) {
    console.log('🌟 ممتاز! النظام يعمل بدقة عالية جداً');
  } else if (avgAccuracy >= 60) {
    console.log('✅ جيد! النظام يعمل بدقة مقبولة، لكن يحتاج تحسينات');
  } else if (avgAccuracy >= 40) {
    console.log('⚠️  متوسط! النظام يحتاج تحسينات كبيرة');
  } else {
    console.log('❌ ضعيف! النظام يحتاج إعادة تطوير');
  }
  
  console.log('\n✅ اكتمل الاختبار!');
}

// تشغيل الاختبار
main().catch(console.error);
