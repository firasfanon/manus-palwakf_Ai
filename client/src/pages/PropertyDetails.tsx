import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Building2, MapPin, FileText, Calendar, Edit } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const propertyTypeLabels: Record<string, string> = {
  mosque: "مسجد",
  building: "مبنى",
  agricultural_land: "أرض زراعية",
  shrine: "مقام",
  cemetery: "مقبرة",
  school: "مدرسة",
  clinic: "عيادة",
  other: "أخرى",
};

const waqfTypeLabels: Record<string, string> = {
  charitable: "خيري",
  family: "ذري",
  mixed: "مختلط",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  disputed: "متنازع عليه",
  under_development: "قيد التطوير",
};

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: property, isLoading } = trpc.properties.getById.useQuery({
    id: parseInt(id || "0"),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">العقار غير موجود</h1>
          <Button onClick={() => navigate("/admin/properties")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة العقارات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "إدارة العقارات", href: "/admin/properties" },
          { label: property.name || "تفاصيل العقار" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/properties")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
        {user?.role === "admin" && (
          <Button onClick={() => navigate(`/admin/properties?edit=${id}`)}>
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
                <Building2 className="h-10 w-10 text-primary mt-1" />
                <div>
                  <CardTitle className="text-3xl mb-2">{property.name}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-sm">{property.nationalKey}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="text-sm">
                  {propertyTypeLabels[property.propertyType] || property.propertyType}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {waqfTypeLabels[property.waqfType] || property.waqfType}
                </Badge>
                <Badge
                  variant={property.status === "active" ? "default" : "destructive"}
                  className="text-sm"
                >
                  {statusLabels[property.status] || property.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المحافظة</p>
                <p className="text-lg">{property.governorate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">المدينة/القرية</p>
                <p className="text-lg">{property.city}</p>
              </div>
            </div>
            {property.address && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">العنوان التفصيلي</p>
                <p className="text-lg">{property.address}</p>
              </div>
            )}
            {property.coordinates && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">الإحداثيات</p>
                <p className="text-lg font-mono">{property.coordinates}</p>
              </div>
            )}
            {property.area && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">المساحة</p>
                <p className="text-lg">{property.area}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {property.description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                الوصف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {property.documents && (
          <Card>
            <CardHeader>
              <CardTitle>الوثائق المرفقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  try {
                    const docs = JSON.parse(property.documents);
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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              معلومات السجل
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">تاريخ الإنشاء</p>
              <p>
                {new Date(property.createdAt).toLocaleDateString("ar-EG", {
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
                {new Date(property.updatedAt).toLocaleDateString("ar-EG", {
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
