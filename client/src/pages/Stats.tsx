import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = trpc.chat.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalConversations = stats?.totalConversations || 0;
  const totalMessages = stats?.totalMessages || 0;
  const totalRatings = stats?.totalRatings || 0;
  const positiveRatings = stats?.positiveRatings || 0;
  const positivePercentage = totalRatings > 0 
    ? Math.round((positiveRatings / totalRatings) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إحصائيات الاستخدام</h1>
        <p className="text-muted-foreground mt-2">
          نظرة عامة على استخدام نموذج الذكاء الصناعي للأوقاف
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحادثات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              محادثة مع النموذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              رسالة متبادلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التقييمات الإيجابية</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positivePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {positiveRatings} من {totalRatings} تقييم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معدل الاستخدام</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              رسالة لكل محادثة
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.categoryCounts && stats.categoryCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المحادثات حسب الفئة</CardTitle>
            <CardDescription>توزيع المحادثات على الفئات المختلفة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryCounts.map((cat: any) => {
                const percentage = totalConversations > 0 
                  ? (cat.count / totalConversations) * 100 
                  : 0;
                
                const categoryNames: Record<string, string> = {
                  general: "عام",
                  legal: "قانوني",
                  jurisprudence: "فقهي",
                  administrative: "إداري",
                  historical: "تاريخي",
                };

                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{categoryNames[cat.category] || cat.category}</span>
                      <span className="text-muted-foreground">{cat.count} محادثة</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
