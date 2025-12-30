import { drizzle } from "drizzle-orm/mysql2";
import { knowledgeDocuments, faqs } from "./drizzle/schema.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Read knowledge base file
    const knowledgeBasePath = path.join(__dirname, "knowledge_data", "knowledge_base.md");
    const knowledgeBaseContent = fs.readFileSync(knowledgeBasePath, "utf-8");

    // Split content into sections
    const sections = knowledgeBaseContent.split(/^## /gm).filter(Boolean);

    console.log(`📚 Found ${sections.length} sections in knowledge base`);

    // Insert knowledge documents
    for (const section of sections) {
      const lines = section.split("\n");
      const title = lines[0]?.trim();
      const content = lines.slice(1).join("\n").trim();

      if (!title || !content) continue;

      // Determine category based on title keywords
      let category = "reference";
      if (title.includes("القانون") || title.includes("التشريع")) {
        category = "law";
      } else if (title.includes("الفقه") || title.includes("الشرعي")) {
        category = "jurisprudence";
      } else if (title.includes("مجلة الأحكام")) {
        category = "majalla";
      } else if (title.includes("التاريخ") || title.includes("العثماني")) {
        category = "historical";
      } else if (title.includes("الإدار") || title.includes("الجهات")) {
        category = "administrative";
      }

      await db.insert(knowledgeDocuments).values({
        title,
        content,
        category,
        source: "قاعدة المعرفة الشاملة",
        isActive: true,
        createdBy: null,
      });

      console.log(`✅ Added document: ${title.substring(0, 50)}...`);
    }

    // Insert FAQs
    const faqData = [
      {
        question: "ما هو تعريف الوقف في الإسلام؟",
        answer:
          "الوقف هو تحبيس ذات معينة مع التصدق بمنفعتها، أو هو حبس العين عن التمليك لأحد من العباد والتصدق بمنفعتها. وهو صدقة جارية يستمر أجرها بعد وفاة الواقف.",
        category: "general",
        order: 1,
      },
      {
        question: "ما هي شروط صحة الوقف؟",
        answer:
          "شروط صحة الوقف ستة: 1) أن يكون الواقف مالكاً جائز التصرف، 2) أن يكون الموقوف عيناً معينة، 3) أن يكون على جهة بر وخير، 4) أن يكون معيناً من جهة، 5) أن يكون ناجزاً غير معلق، 6) ألا يشترط فيه شرط ينافي الوقف.",
        category: "conditions",
        order: 2,
      },
      {
        question: "ما الفرق بين الوقف الخيري والوقف الذري؟",
        answer:
          "الوقف الخيري هو وقف يخصص ريعه لصالح جهات عامة وأغراض خيرية مثل المساجد والمدارس والمستشفيات. أما الوقف الذري (الأهلي) فهو وقف يخصص ريعه لذرية الواقف أولاً، ثم ينتقل إلى جهات خيرية بعد انقطاع الذرية.",
        category: "types",
        order: 3,
      },
      {
        question: "من هي الجهة المسؤولة عن إدارة الأوقاف في فلسطين؟",
        answer:
          "وزارة الأوقاف والشؤون الدينية الفلسطينية هي الجهة الرئيسية المسؤولة عن إدارة الأوقاف، بالإضافة إلى مجلس الأوقاف والشؤون والمقدسات الإسلامية الذي يشرف على إدارة الأوقاف.",
        category: "management",
        order: 4,
      },
      {
        question: "ما هو القانون الأساسي الذي ينظم الأوقاف في فلسطين؟",
        answer:
          "القانون الأساسي هو قانون الأوقاف والشؤون الدينية رقم (26) لسنة 1966م وتعديلاته، بالإضافة إلى قرار بقانون رقم (2) لسنة 2023م بشأن تعديل قانون الأوقاف والشؤون والمقدسات الإسلامية.",
        category: "legal",
        order: 5,
      },
      {
        question: "ما هي مجلة الأحكام العدلية؟",
        answer:
          "مجلة الأحكام العدلية هي قانون مدني عثماني صدر عام 1876، مستمد من الفقه الحنفي، وتشتمل على أحكام مدنية موحدة. لا تزال سارية المفعول في فلسطين وتحتوي على 99 قاعدة فقهية كلية.",
        category: "jurisprudence",
        order: 6,
      },
      {
        question: "هل يمكن بيع الوقف أو تحويل ملكيته؟",
        answer:
          "لا، الوقف لا يمكن بيعه أو هبته أو تحويل ملكيته. فالواقف يفقد ملكيته للموقوف بمجرد الوقف، ولا يحق له الرجوع عن الوقف بعد تنفيذه. هذا من خصائص الوقف الأساسية.",
        category: "general",
        order: 7,
      },
      {
        question: "ما هي مسؤوليات ناظر الوقف؟",
        answer:
          "الناظر أمين على الوقف وأمواله، ووكيل عن المستحقين وممثل شرعي لهم. يجب عليه إدارة الوقف بكفاءة وأمانة، وتحصيل ريع الوقف وصرفه وفقاً لشروط الواقف، والحفاظ على الموقوف من التلف.",
        category: "management",
        order: 8,
      },
      {
        question: "ما هي أنواع الأوقاف من حيث الجهة الموقوف عليها؟",
        answer:
          "تشمل أنواع الأوقاف: الوقف على المساجد والمقامات، الوقف على المدارس والتعليم، الوقف على المستشفيات، الوقف على المقابر، الوقف على الفقراء والمحتاجين، الوقف على دور الأيتام، والوقف على المكتبات والمراكز الثقافية.",
        category: "types",
        order: 9,
      },
      {
        question: "كيف يتم توثيق الوقف قانونياً؟",
        answer:
          "يتم توثيق الوقف من خلال: 1) كتابة حجة الوقف بوضوح، 2) تحديد الموقوف بدقة، 3) تحديد الموقوف عليه بوضوح، 4) توقيع الواقف والشهود، 5) التسجيل لدى وزارة الأوقاف والجهات المختصة.",
        category: "legal",
        order: 10,
      },
    ];

    for (const faq of faqData) {
      await db.insert(faqs).values({
        ...faq,
        isActive: true,
        viewCount: 0,
        createdBy: null,
      });
      console.log(`✅ Added FAQ: ${faq.question.substring(0, 50)}...`);
    }

    console.log("✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("🎉 Seeding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
