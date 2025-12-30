import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Scale, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CompareTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [ruling1Id, setRuling1Id] = useState("");
  const [ruling2Id, setRuling2Id] = useState("");
  const [result, setResult] = useState<any>(null);

  const compareMutation = trpc.legalAnalysis.compareRulings.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تمت المقارنة بنجاح");
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
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">مقارنة الأحكام</h1>
              <p className="text-muted-foreground mt-1">
                مقارنة حكمين قضائيين وتحليل الفروقات والتشابهات
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل معرفات الأحكام</CardTitle>
            <CardDescription>
              أدخل رقم الحكم الأول والثاني للمقارنة بينهما
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">الحكم الأول</label>
                <Input
                  type="number"
                  placeholder="رقم الحكم"
                  value={ruling1Id}
                  onChange={(e) => setRuling1Id(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحكم الثاني</label>
                <Input
                  type="number"
                  placeholder="رقم الحكم"
                  value={ruling2Id}
                  onChange={(e) => setRuling2Id(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => compareMutation.mutate({ 
                ruling1: ruling1Id, 
                ruling2: ruling2Id 
              })}
              disabled={compareMutation.isPending || !ruling1Id || !ruling2Id}
              className="w-full"
            >
              {compareMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري المقارنة...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  مقارنة الأحكام
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>نتيجة المقارنة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">الحكم الأول</h3>
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <p><strong>الرقم:</strong> {result.ruling1?.caseNumber}</p>
                    <p><strong>المحكمة:</strong> {result.ruling1?.court}</p>
                    <p><strong>التاريخ:</strong> {result.ruling1?.date}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">الحكم الثاني</h3>
                  <div className="p-4 bg-green-50 rounded-lg space-y-2">
                    <p><strong>الرقم:</strong> {result.ruling2?.caseNumber}</p>
                    <p><strong>المحكمة:</strong> {result.ruling2?.court}</p>
                    <p><strong>التاريخ:</strong> {result.ruling2?.date}</p>
                  </div>
                </div>
              </div>

              {result.similarities?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">أوجه التشابه</h3>
                  <ul className="space-y-2">
                    {result.similarities.map((sim: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{sim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.differences?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">أوجه الاختلاف</h3>
                  <ul className="space-y-2">
                    {result.differences.map((diff: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-3 bg-orange-50 rounded">
                        <span className="text-orange-600 mt-1">!</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis && (
                <div className="p-4 bg-accent rounded-lg">
                  <h3 className="font-semibold mb-2">التحليل</h3>
                  <p className="leading-relaxed">{result.analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
