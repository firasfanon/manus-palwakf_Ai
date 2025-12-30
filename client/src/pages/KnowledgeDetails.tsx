import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, ExternalLink, Calendar, Tag, BookOpen } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import DocumentFilesManager from "@/components/DocumentFilesManager";
import { useAuth } from "@/_core/hooks/useAuth";

export default function KnowledgeDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0");
  const { user } = useAuth();

  const { data: document, isLoading } = trpc.knowledge.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>المرجع غير موجود</CardTitle>
            <CardDescription>لم يتم العثور على المرجع المطلوب</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/knowledge")}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى قاعدة المعرفة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    law: "قانوني",
    jurisprudence: "فقهي",
    majalla: "مجلة الأحكام",
    historical: "تاريخي",
    administrative: "إداري",
    reference: "مرجع",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "قاعدة المعرفة", href: "/knowledge" },
            { label: document.title },
          ]}
        />

        <div className="mt-6 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle className="text-3xl">{document.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(document.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                    <Badge variant="secondary">
                      {categoryLabels[document.category] || document.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setLocation("/knowledge")}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Content Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المحتوى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{document.content}</p>
              </div>
            </CardContent>
          </Card>

          {/* PDF Preview Card */}
          {document.pdfUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  معاينة ملف PDF
                </CardTitle>
                <CardDescription>
                  يمكنك معاينة الملف مباشرة أو تحميله من الزر أدناه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <a href={document.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="ml-2 h-4 w-4" />
                      فتح في نافذة جديدة
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={document.pdfUrl} download>
                      <FileText className="ml-2 h-4 w-4" />
                      تحميل الملف
                    </a>
                  </Button>
                </div>
                
                {/* PDF Viewer */}
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={document.pdfUrl}
                    className="w-full h-[800px]"
                    title="معاينة PDF"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Files Manager */}
          <DocumentFilesManager documentId={id} isAdmin={user?.role === "admin"} />

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                معلومات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.source && (
                <div>
                  <h3 className="font-semibold mb-1">المصدر</h3>
                  <p className="text-muted-foreground">{document.source}</p>
                </div>
              )}

              {document.sourceUrl && (
                <div>
                  <h3 className="font-semibold mb-1">رابط المصدر</h3>
                  <a
                    href={document.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {document.sourceUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {document.tags && (
                <div>
                  <h3 className="font-semibold mb-2">الكلمات المفتاحية</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">الفئة</h3>
                  <Badge>{categoryLabels[document.category] || document.category}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">تاريخ الإضافة</h3>
                  <p className="text-muted-foreground">
                    {new Date(document.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
