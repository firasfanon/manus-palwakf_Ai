import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PrecedentsTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState<any>(null);

  const analyzeMutation = trpc.legalAnalysis.analyzePrecedents.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تم التحليل بنجاح");
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
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">تحليل السوابق القضائية</h1>
              <p className="text-muted-foreground mt-1">
                تحليل السوابق المشابهة لقضية معينة
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل رقم القضية</CardTitle>
            <CardDescription>
              سيتم البحث عن السوابق المشابهة وتحليلها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="رقم القضية"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
            />
            <Button
              onClick={() => analyzeMutation.mutate({ caseDescription: caseId })}
              disabled={analyzeMutation.isPending || !caseId}
              className="w-full"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  تحليل السوابق
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>نتيجة التحليل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.precedents?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">السوابق المشابهة ({result.precedents.length})</h3>
                  <div className="space-y-3">
                    {result.precedents.map((prec: any, i: number) => (
                      <div key={i} className="p-4 bg-accent rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{prec.title}</p>
                          <span className="text-sm text-muted-foreground">{prec.date}</span>
                        </div>
                        <p className="text-sm">{prec.summary}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            تشابه: {(prec.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.patterns?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">الأنماط المكتشفة</h3>
                  <ul className="space-y-2">
                    {result.patterns.map((pattern: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                        <span className="text-blue-600 mt-1">→</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">التوصيات</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
