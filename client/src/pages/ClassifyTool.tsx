import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ClassifyTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const classifyMutation = trpc.aiTools.classify.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تم التصنيف بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ أثناء التصنيف: " + error.message);
    },
  });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <Button onClick={() => navigate("/")}>العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  const handleClassify = () => {
    if (!text.trim()) {
      toast.error("الرجاء إدخال نص للتصنيف");
      return;
    }
    classifyMutation.mutate({ text, type: "document" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">التصنيف التلقائي</h1>
              <p className="text-muted-foreground mt-1">
                تصنيف الوثائق والنصوص تلقائياً حسب النوع والفئة
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة للأدوات
          </Button>
        </div>

        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>أدخل النص المراد تصنيفه</CardTitle>
            <CardDescription>
              يمكنك إدخال نص من وثيقة، حكم قضائي، تعليمات وزارية، أو أي نص قانوني آخر
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="مثال: حكم قضائي صادر عن المحكمة الشرعية في القدس..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="resize-none"
            />
            <Button
              onClick={handleClassify}
              disabled={classifyMutation.isPending}
              className="w-full"
            >
              {classifyMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التصنيف...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  تصنيف النص
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card */}
        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                نتيجة التصنيف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع الوثيقة</label>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold text-lg">{result.documentType}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الفئة</label>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold text-lg">{result.category}</p>
                  </div>
                </div>
              </div>

              {result.subcategory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">الفئة الفرعية</label>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold">{result.subcategory}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">درجة الثقة</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-accent rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              {result.tags && result.tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">الكلمات المفتاحية</label>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.reasoning && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">التفسير</label>
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-sm leading-relaxed">{result.reasoning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Examples Card */}
        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle>أمثلة على التصنيف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p>
                <strong>حكم قضائي:</strong> يتم تصنيفه حسب المحكمة، نوع القضية، والموضوع
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p>
                <strong>تعليمات وزارية:</strong> يتم تصنيفها حسب الجهة المصدرة والموضوع
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <p>
                <strong>حجة وقفية:</strong> يتم تصنيفها حسب نوع الوقف والعقار
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
