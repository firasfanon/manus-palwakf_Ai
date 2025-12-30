import { Button } from "@/components/ui/button";
import { MessageCircle, Scale, Building, BookOpen, History } from "lucide-react";

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const suggestedQuestions = [
  {
    category: "legal",
    icon: Scale,
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
    questions: [
      "ما هي شروط صحة الوقف في القانون الفلسطيني؟",
      "كيف يتم نقل ملكية الأراضي الموقوفة؟",
    ],
  },
  {
    category: "jurisprudence",
    icon: BookOpen,
    color: "text-green-600 bg-green-50 hover:bg-green-100 border-green-200",
    questions: [
      "ما هو الفرق بين الوقف الذري والوقف الخيري؟",
      "هل يجوز بيع العقار الموقوف؟",
    ],
  },
  {
    category: "administrative",
    icon: Building,
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200",
    questions: [
      "كيف أسجل وقفاً جديداً في وزارة الأوقاف؟",
      "ما هي إجراءات إدارة الأملاك الوقفية؟",
    ],
  },
  {
    category: "historical",
    icon: History,
    color: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200",
    questions: [
      "ما هي أشهر الأوقاف التاريخية في فلسطين؟",
      "كيف تطور نظام الأوقاف في العهد العثماني؟",
    ],
  },
];

export function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">ابدأ محادثتك</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          اختر أحد الأسئلة الشائعة أو اكتب سؤالك الخاص
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {suggestedQuestions.map((category) => (
          <div key={category.category} className="space-y-2">
            {category.questions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full justify-start text-right h-auto py-3 px-4 ${category.color} border`}
                onClick={() => onQuestionClick(question)}
              >
                <category.icon className="w-4 h-4 ml-2 flex-shrink-0" />
                <span className="text-sm">{question}</span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
