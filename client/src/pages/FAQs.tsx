import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Eye, HelpCircle, Scale, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQs() {
  const { user } = useAuth();
  const { data: faqs, isLoading } = trpc.faqs.list.useQuery();
  const incrementViewMutation = trpc.faqs.incrementView.useMutation();
  const generateFAQsMutation = trpc.faqs.generateFromFrequentQuestions.useMutation({
    onSuccess: (data) => {
      toast.success(`تم توليد ${data.created} سؤال جديد من ${data.total} سؤال متكرر`);
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleFAQClick = (id: number) => {
    incrementViewMutation.mutate({ id });
  };

  const categories = [
    { value: "all", label: "الكل" },
    { value: "general", label: "عام" },
    { value: "conditions", label: "شروط الوقف" },
    { value: "types", label: "أنواع الوقف" },
    { value: "management", label: "إدارة الوقف" },
    { value: "legal", label: "قانوني" },
    { value: "jurisprudence", label: "فقهي" },
  ];

  const filterFAQsByCategory = (category: string) => {
    if (category === "all") return faqs || [];
    return faqs?.filter((faq) => faq.category === category) || [];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">الأسئلة الشائعة</h1>
              </div>
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => generateFAQsMutation.mutate({ limit: 10 })}
                  disabled={generateFAQsMutation.isPending}
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  {generateFAQsMutation.isPending ? 'جاري التوليد...' : 'توليد FAQs تلقائياً'}
                </Button>
              )}
              <Button asChild>
                <Link href="/chat">ابدأ المحادثة</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">الأسئلة الشائعة</h2>
            <p className="text-lg text-muted-foreground">
              إجابات على أكثر الأسئلة شيوعاً حول الأوقاف الإسلامية في فلسطين
            </p>
          </div>
        </div>
      </section>

      {/* FAQs Content */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-8">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value} className="text-sm">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat.value} value={cat.value} className="space-y-4">
                  {isLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-20 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-4">
                      {filterFAQsByCategory(cat.value).map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={`faq-${faq.id}`}
                          className="border rounded-lg px-6"
                        >
                          <AccordionTrigger
                            className="hover:no-underline"
                            onClick={() => handleFAQClick(faq.id)}
                          >
                            <div className="flex items-start gap-3 text-right">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <HelpCircle className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-foreground text-lg">{faq.question}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {faq.viewCount} مشاهدة
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pr-11 pt-2">
                              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {faq.answer}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}

                  {!isLoading && filterFAQsByCategory(cat.value).length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-2">لا توجد أسئلة في هذا التصنيف</h3>
                        <p className="text-muted-foreground">جرب تصنيفاً آخر أو ابدأ محادثة مع النموذج</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <Card className="max-w-3xl mx-auto border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">لم تجد إجابة لسؤالك؟</CardTitle>
              <CardDescription className="text-base">
                تحدث مع النموذج الذكي المتخصص في الأوقاف الإسلامية واحصل على إجابة مفصلة ودقيقة
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/chat">ابدأ المحادثة الآن</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/search">ابحث في قاعدة المعرفة</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
