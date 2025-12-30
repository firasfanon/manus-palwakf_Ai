import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ExtractTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const extractMutation = trpc.aiTools.extract.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تم استخراج المعلومات بنجاح");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate("/")}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">استخراج المعلومات</h1>
              <p className="text-muted-foreground mt-1">
                استخراج الكيانات والمعلومات من النصوص القانونية
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل النص</CardTitle>
            <CardDescription>
              سيتم استخراج الأسماء، التواريخ، الأماكن، المبالغ، والمعلومات القانونية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="مثال: حكم صادر بتاريخ 15/3/2023 من المحكمة الشرعية في القدس..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
            />
            <Button
              onClick={() => extractMutation.mutate({ text })}
              disabled={extractMutation.isPending}
              className="w-full"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاستخراج...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  استخراج المعلومات
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>المعلومات المستخرجة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.entities?.names?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">الأسماء</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.names.map((name: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.entities?.dates?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">التواريخ</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.dates.map((date: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.entities?.locations?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">الأماكن</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.locations.map((loc: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.entities?.amounts?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">المبالغ</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.entities.amounts.map((amt: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {amt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
