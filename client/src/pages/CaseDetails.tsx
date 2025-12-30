import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Scale, FileText, Calendar, Edit, Building2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const caseTypeLabels: Record<string, string> = {
  ownership_dispute: "نزاع ملكية",
  boundary_dispute: "نزاع حدود",
  usage_violation: "مخالفة استخدام",
  inheritance: "ميراث",
  management_dispute: "نزاع إدارة",
  encroachment: "تعدي",
  other: "أخرى",
};

const statusLabels: Record<string, string> = {
  pending: "قيد النظر",
  under_investigation: "قيد التحقيق",
  in_court: "في المحكمة",
  resolved: "محلول",
  closed: "مغلق",
};

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: caseData, isLoading } = trpc.cases.getById.useQuery({
    id: parseInt(id || "0"),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">القضية غير موجودة</h1>
          <Button onClick={() => navigate("/admin/cases")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة القضايا
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "إدارة القضايا", href: "/admin/cases" },
          { label: caseData.title || "تفاصيل القضية" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/cases")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
        {user?.role === "admin" && (
          <Button onClick={() => navigate(`/admin/cases?edit=${id}`)}>
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
                <Scale className="h-10 w-10 text-primary mt-1" />
                <div>
                  <CardTitle className="text-3xl mb-2">{caseData.title}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-sm">{caseData.caseNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="text-sm">
                  {caseTypeLabels[caseData.caseType] || caseData.caseType}
                </Badge>
                <Badge
                  variant={caseData.status === "resolved" ? "default" : "destructive"}
                  className="text-sm"
                >
                  {statusLabels[caseData.status] || caseData.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              وصف القضية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {caseData.description}
            </p>
          </CardContent>
        </Card>

        {/* Court Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المحكمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {caseData.court && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">المحكمة</p>
                <p className="text-lg">{caseData.court}</p>
              </div>
            )}
            {caseData.judge && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">القاضي</p>
                <p className="text-lg">{caseData.judge}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle>أطراف القضية</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {caseData.plaintiff && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">المدعي</p>
                <p className="text-lg">{caseData.plaintiff}</p>
              </div>
            )}
            {caseData.defendant && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">المدعى عليه</p>
                <p className="text-lg">{caseData.defendant}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              التواريخ المهمة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {caseData.filingDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ رفع الدعوى</p>
                <p className="text-lg">
                  {new Date(caseData.filingDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {caseData.hearingDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ الجلسة</p>
                <p className="text-lg">
                  {new Date(caseData.hearingDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {caseData.verdictDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ الحكم</p>
                <p className="text-lg">
                  {new Date(caseData.verdictDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verdict */}
        {caseData.verdict && (
          <Card>
            <CardHeader>
              <CardTitle>الحكم</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{caseData.verdict}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {caseData.notes && (
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{caseData.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {caseData.documents && (
          <Card>
            <CardHeader>
              <CardTitle>الوثائق المرفقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  try {
                    const docs = JSON.parse(caseData.documents);
                    return Array.isArray(docs) && docs.length > 0 ? (
                      docs.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <a
                            href={doc.url || doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                          >
                            {doc.name || `وثيقة ${index + 1}`}
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">لا توجد وثائق مرفقة</p>
                    );
                  } catch {
                    return <p className="text-muted-foreground">لا توجد وثائق مرفقة</p>;
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات السجل</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">تاريخ الإنشاء</p>
              <p>
                {new Date(caseData.createdAt).toLocaleDateString("ar-EG", {
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
                {new Date(caseData.updatedAt).toLocaleDateString("ar-EG", {
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
