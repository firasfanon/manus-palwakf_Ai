#!/usr/bin/env node
/**
 * إضافة المصادر المستخرجة إلى قاعدة البيانات
 */

import { readFileSync } from 'fs';
import { getDb } from './server/db.ts';
import { knowledgeBase } from './drizzle/schema.ts';

async function main() {
  console.log('قراءة المصادر المستخرجة...');
  
  const sourcesData = JSON.parse(
    readFileSync('/home/ubuntu/extracted_sources.json', 'utf-8')
  );
  
  const db = getDb();
  if (!db) {
    console.error('فشل الاتصال بقاعدة البيانات');
    process.exit(1);
  }
  
  let totalAdded = 0;
  
  // إضافة القوانين
  console.log('\nإضافة القوانين والأنظمة...');
  for (const law of sourcesData.قوانين) {
    try {
      await db.insert(knowledgeBase).values({
        title: law.name,
        content: `${law.description}\n\nالنوع: ${law.type}\nالسنة: ${law.year}\nالمصدر: ${law.source}`,
        category: 'قوانين',
        tags: JSON.stringify([law.type, `سنة ${law.year}`, 'تشريعات فلسطينية']),
        source: law.source,
        sourceType: 'قانون',
        isVerified: true,
        createdBy: 1
      });
      totalAdded++;
      console.log(`✓ ${law.name}`);
    } catch (error) {
      console.error(`✗ فشل إضافة: ${law.name}`, error.message);
    }
  }
  
  // إضافة الكتب الفقهية
  console.log('\nإضافة الكتب الفقهية...');
  for (const book of sourcesData.كتب_فقهية) {
    try {
      const content = book.author 
        ? `${book.description}\n\nالمؤلف: ${book.author}\nالمصدر: ${book.source}`
        : `${book.description}\n\nالمصدر: ${book.source}`;
      
      await db.insert(knowledgeBase).values({
        title: book.name,
        content,
        category: 'فقه',
        tags: JSON.stringify(['فقه الوقف', 'كتب فقهية', book.type]),
        source: book.source,
        sourceType: 'كتاب',
        isVerified: true,
        createdBy: 1
      });
      totalAdded++;
      console.log(`✓ ${book.name}`);
    } catch (error) {
      console.error(`✗ فشل إضافة: ${book.name}`, error.message);
    }
  }
  
  // إضافة الكتب التاريخية
  console.log('\nإضافة الكتب والدراسات التاريخية...');
  for (const book of sourcesData.كتب_تاريخية) {
    try {
      await db.insert(knowledgeBase).values({
        title: book.name,
        content: `${book.description}\n\nالمصدر: ${book.source}`,
        category: 'تاريخ',
        tags: JSON.stringify(['تاريخ الأوقاف', 'فلسطين', book.type]),
        source: book.source,
        sourceType: book.type,
        isVerified: true,
        createdBy: 1
      });
      totalAdded++;
      console.log(`✓ ${book.name}`);
    } catch (error) {
      console.error(`✗ فشل إضافة: ${book.name}`, error.message);
    }
  }
  
  // إضافة الدراسات والتقارير
  console.log('\nإضافة الدراسات والتقارير المعاصرة...');
  for (const report of sourcesData.دراسات) {
    try {
      const content = report.organization
        ? `${report.description}\n\nالمنظمة: ${report.organization}\nالمصدر: ${report.source}`
        : `${report.description}\n\nالمصدر: ${report.source}`;
      
      await db.insert(knowledgeBase).values({
        title: report.name,
        content,
        category: 'دراسات',
        tags: JSON.stringify([report.type, 'دراسات معاصرة', 'الأوقاف في فلسطين']),
        source: report.source,
        sourceType: report.type,
        isVerified: true,
        createdBy: 1
      });
      totalAdded++;
      console.log(`✓ ${report.name}`);
    } catch (error) {
      console.error(`✗ فشل إضافة: ${report.name}`, error.message);
    }
  }
  
  // إضافة المصادر القضائية
  console.log('\nإضافة المصادر القضائية...');
  for (const judicial of sourcesData.مصادر_قضائية) {
    try {
      const content = judicial.organization
        ? `${judicial.description}\n\nالمنظمة: ${judicial.organization}\nالموقع: ${judicial.location || 'فلسطين'}\nالمصدر: ${judicial.source}`
        : `${judicial.description}\n\nالموقع: ${judicial.location || 'فلسطين'}\nالمصدر: ${judicial.source}`;
      
      await db.insert(knowledgeBase).values({
        title: judicial.name,
        content,
        category: 'قضاء',
        tags: JSON.stringify([judicial.type, 'قضاء شرعي', 'أحكام قضائية']),
        source: judicial.source,
        sourceType: judicial.type,
        isVerified: true,
        createdBy: 1
      });
      totalAdded++;
      console.log(`✓ ${judicial.name}`);
    } catch (error) {
      console.error(`✗ فشل إضافة: ${judicial.name}`, error.message);
    }
  }
  
  console.log(`\n✅ تم إضافة ${totalAdded} مصدراً إلى قاعدة المعرفة بنجاح!`);
  process.exit(0);
}

main().catch((error) => {
  console.error('حدث خطأ:', error);
  process.exit(1);
});
