import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PredictTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [caseDescription, setCaseDescription] = useState("");
  const [result, setResult] = useState<any>(null);

  const predictMutation = trpc.legalAnalysis.predictOutcome.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تم التوقع بنجاح");
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
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">توقع نتائج القضايا</h1>
              <p className="text-muted-foreground mt-1">
                توقع نتيجة القضية بناءً على السوابق القضائية
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>وصف القضية</CardTitle>
            <CardDescription>
              أدخل وصفاً تفصيلياً للقضية للحصول على توقع بالنتيجة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="مثال: قضية نزاع على عقار وقفي في القدس، المدعي يطالب بإثبات ملكيته..."
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={10}
            />
            <Button
              onClick={() => predictMutation.mutate({ caseDescription, party: "plaintiff" })}
              disabled={predictMutation.isPending || !caseDescription}
              className="w-full"
            >
              {predictMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التوقع...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  توقع النتيجة
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>التوقع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">النتيجة المتوقعة</h3>
                  <span className="text-3xl font-bold text-primary">
                    {(result.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-lg">{result.prediction}</p>
              </div>

              {result.factors?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">العوامل المؤثرة</h3>
                  <div className="space-y-2">
                    {result.factors.map((factor: any, i: number) => (
                      <div key={i} className="p-3 bg-accent rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{factor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            تأثير: {(factor.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${factor.weight * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.similarCases?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">قضايا مشابهة</h3>
                  <div className="space-y-2">
                    {result.similarCases.map((case_: any, i: number) => (
                      <div key={i} className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium">{case_.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{case_.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2">التوصيات</h3>
                  <p className="leading-relaxed">{result.recommendations}</p>
                </div>
              )}

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>تنويه:</strong> هذا التوقع مبني على تحليل السوابق القضائية ولا يمثل حكماً
                  قانونياً نهائياً. يجب استشارة محامٍ مختص.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
