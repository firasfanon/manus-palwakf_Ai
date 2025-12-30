import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Gavel, FileText, Calendar, Edit } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const statusLabels: Record<string, string> = {
  final: "نهائي",
  appealable: "قابل للاستئناف",
  appealed: "مستأنف",
};

export default function RulingDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: ruling, isLoading } = trpc.rulings.getById.useQuery({
    id: parseInt(id || "0"),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ruling) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">الحكم غير موجود</h1>
          <Button onClick={() => navigate("/admin/rulings")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة الأحكام
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "إدارة الأحكام", href: "/admin/rulings" },
          { label: ruling.title || "تفاصيل الحكم" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/rulings")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
        {user?.role === "admin" && (
          <Button onClick={() => navigate(`/admin/rulings?edit=${id}`)}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Gavel className="h-10 w-10 text-primary mt-1" />
                <div>
                  <CardTitle className="text-3xl mb-2">{ruling.title}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-sm">{ruling.caseNumber}</span>
                  </div>
                </div>
              </div>
              <Badge
                variant={ruling.status === "final" ? "default" : "outline"}
                className="text-sm"
              >
                {statusLabels[ruling.status] || ruling.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Court Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المحكمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">المحكمة</p>
              <p className="text-lg">{ruling.court}</p>
            </div>
            {ruling.judge && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">القاضي</p>
                <p className="text-lg">{ruling.judge}</p>
              </div>
            )}
            {ruling.rulingDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ الحكم</p>
                <p className="text-lg">
                  {new Date(ruling.rulingDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ملخص الحكم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{ruling.summary}</p>
          </CardContent>
        </Card>

        {/* Full Text */}
        {ruling.fullText && (
          <Card>
            <CardHeader>
              <CardTitle>النص الكامل</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{ruling.fullText}</p>
            </CardContent>
          </Card>
        )}

        {/* Legal Principle */}
        {ruling.legalPrinciple && (
          <Card>
            <CardHeader>
              <CardTitle>المبدأ القانوني المستخلص</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {ruling.legalPrinciple}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Related Articles */}
        {ruling.relatedArticles && (
          <Card>
            <CardHeader>
              <CardTitle>المواد القانونية المرتبطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  try {
                    const articles = JSON.parse(ruling.relatedArticles);
                    return Array.isArray(articles) && articles.length > 0 ? (
                      articles.map((article: any, index: number) => (
                        <div key={index} className="p-2 bg-muted rounded">
                          <p className="text-sm">{article.title || article}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">لا توجد مواد قانونية مرتبطة</p>
                    );
                  } catch {
                    return <p className="text-muted-foreground">لا توجد مواد قانونية مرتبطة</p>;
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {ruling.tags && (
          <Card>
            <CardHeader>
              <CardTitle>الوسوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  try {
                    const tags = JSON.parse(ruling.tags);
                    return Array.isArray(tags) && tags.length > 0 ? (
                      tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {ruling.attachments && (
          <Card>
            <CardHeader>
              <CardTitle>المرفقات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  try {
                    const attachments = JSON.parse(ruling.attachments);
                    return Array.isArray(attachments) && attachments.length > 0 ? (
                      attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <a
                            href={attachment.url || attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                          >
                            {attachment.name || `مرفق ${index + 1}`}
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">لا توجد مرفقات</p>
                    );
                  } catch {
                    return <p className="text-muted-foreground">لا توجد مرفقات</p>;
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              معلومات السجل
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">تاريخ الإنشاء</p>
              <p>
                {new Date(ruling.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">آخر تحديث</p>
              <p>
                {new Date(ruling.updatedAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
