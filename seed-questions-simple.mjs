import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

const questions = [
  { question: "ما هي شروط صحة الوقف في الشريعة الإسلامية والقانون الفلسطيني؟", category: "legal", displayOrder: 1 },
  { question: "كيف يتم نقل ملكية الأراضي الموقوفة وفقاً للقوانين الفلسطينية؟", category: "legal", displayOrder: 2 },
  { question: "ما هو الفرق بين الوقف الذري والوقف الخيري؟", category: "fiqh", displayOrder: 3 },
  { question: "هل يجوز بيع العقار الموقوف أو استبداله؟", category: "fiqh", displayOrder: 4 },
  { question: "كيف أسجل وقفاً جديداً في فلسطين؟", category: "administrative", displayOrder: 5 },
  { question: "ما هي إجراءات إدارة الأوقاف والإشراف عليها؟", category: "administrative", displayOrder: 6 },
  { question: "ما هي أشهر الأوقاف التاريخية في فلسطين؟", category: "historical", displayOrder: 7 },
  { question: "كيف تطور نظام الأوقاف في فلسطين عبر التاريخ؟", category: "historical", displayOrder: 8 },
];

async function seedQuestions() {
  console.log('🌱 Starting to seed suggested questions...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    for (const q of questions) {
      await connection.execute(
        'INSERT INTO suggested_questions (question, category, display_order, is_active) VALUES (?, ?, ?, ?)',
        [q.question, q.category, q.displayOrder, true]
      );
      console.log(`✅ Added: ${q.question.substring(0, 50)}...`);
    }
    console.log(`\n🎉 Successfully seeded ${questions.length} suggested questions!`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedQuestions().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
