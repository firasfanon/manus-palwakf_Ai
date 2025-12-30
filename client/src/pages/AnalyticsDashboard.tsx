import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, TrendingUp, MessageSquare, Lightbulb, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AnalyticsDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getRatingStats.useQuery();
  const { data: negativeAnalysis, isLoading: negativeLoading } = trpc.analytics.analyzeNegativeRatings.useQuery();
  const { data: frequentQuestions, isLoading: questionsLoading } = trpc.analytics.getFrequentQuestions.useQuery({ limit: 10 });
  const { data: bestAnswers, isLoading: answersLoading } = trpc.analytics.getBestAnswers.useQuery({ limit: 10 });
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.analytics.getImprovementSuggestions.useQuery();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">لوحة التحليلات والتقييمات</h1>
        <p className="text-muted-foreground">
          تحليل شامل لأداء نظام الذكاء الصناعي واقتراحات التحسين
        </p>
      </div>

      {/* إحصائيات التقييمات */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التقييمات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تقييمات إيجابية</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.positive || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.positivePercentage}% من الإجمالي
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تقييمات سلبية</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.negative || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.negativePercentage}% من الإجمالي
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تحليل التقييمات السلبية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تحليل التقييمات السلبية
          </CardTitle>
          <CardDescription>
            الأنماط الشائعة في التقييمات السلبية والمشاكل المتكررة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {negativeLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : negativeAnalysis ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">إحصائيات عامة:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• إجمالي التقييمات السلبية: {negativeAnalysis.totalNegative}</li>
                    <li>• إجابات بدون مصادر: {negativeAnalysis.withoutSources}</li>
                    <li>• إجابات قصيرة جداً: {negativeAnalysis.shortResponses}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">المشاكل الشائعة:</p>
                  <div className="flex flex-wrap gap-2">
                    {negativeAnalysis.commonIssues.map((issue: string, index: number) => (
                      <Badge key={index} variant="destructive">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>لا توجد تقييمات سلبية حتى الآن</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* اقتراحات التحسين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            اقتراحات التحسين التلقائية
          </CardTitle>
          <CardDescription>
            توصيات مبنية على تحليل التقييمات والأداء
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 ? (
            <ul className="space-y-3">
              {suggestions.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Alert>
              <AlertDescription>
                النظام يعمل بشكل جيد! لا توجد اقتراحات تحسين حالياً.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* الأسئلة الأكثر تكراراً */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              الأسئلة الأكثر تكراراً
            </CardTitle>
            <CardDescription>
              الأسئلة التي يطرحها المستخدمون بشكل متكرر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : frequentQuestions && frequentQuestions.length > 0 ? (
              <div className="space-y-3">
                {frequentQuestions.map((item, index) => (
                  <div key={index} className="border-b pb-2 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{item.content}</p>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>لا توجد أسئلة متكررة حتى الآن</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* أفضل الإجابات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              أفضل الإجابات
            </CardTitle>
            <CardDescription>
              الإجابات الأكثر حصولاً على تقييمات إيجابية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {answersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : bestAnswers && bestAnswers.length > 0 ? (
              <div className="space-y-3">
                {bestAnswers.map((item, index) => (
                  <div key={index} className="border-b pb-2 last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium flex-1">رسالة #{item.messageId}</p>
                      <Badge variant="default" className="bg-green-600">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {item.positiveRatings}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>لا توجد إجابات مقيّمة حتى الآن</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ملاحظات</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • يتم تحديث التحليلات تلقائياً بناءً على تقييمات المستخدمين
          </p>
          <p>
            • استخدم هذه البيانات لتحسين جودة المحتوى والإجابات
          </p>
          <p>
            • الأسئلة المتكررة يمكن إضافتها إلى قسم الأسئلة الشائعة (FAQ)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
