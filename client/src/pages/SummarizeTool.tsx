import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, FileSearch, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SummarizeTool() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const summarizeMutation = trpc.aiTools.summarize.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("تم التلخيص بنجاح");
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
            <FileSearch className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">التلخيص الذكي</h1>
              <p className="text-muted-foreground mt-1">
                تلخيص الأحكام والوثائق الطويلة بشكل ذكي ومختصر
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أدخل النص المراد تلخيصه</CardTitle>
            <CardDescription>
              يمكن تلخيص الأحكام القضائية، الوثائق القانونية، أو أي نص طويل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="الصق النص الطويل هنا..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={15}
            />
            <Button
              onClick={() => summarizeMutation.mutate({ text })}
              disabled={summarizeMutation.isPending}
              className="w-full"
            >
              {summarizeMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التلخيص...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  تلخيص النص
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>الملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-accent rounded-lg">
                <p className="leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              </div>
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">النقاط الرئيسية</h3>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{point}</span>
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
