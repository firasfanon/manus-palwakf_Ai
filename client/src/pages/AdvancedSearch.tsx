import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Building2,
  Gavel,
  Scale,
  FileCheck,
  ScrollText,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";

const typeLabels: Record<string, { label: string; icon: any }> = {
  property: { label: "عقارات وقفية", icon: Building2 },
  case: { label: "قضايا", icon: Gavel },
  ruling: { label: "أحكام قضائية", icon: Scale },
  deed: { label: "حجج وقفية", icon: FileCheck },
  instruction: { label: "تعليمات وزارية", icon: ScrollText },
  knowledge: { label: "وثائق معرفية", icon: FileText },
};

const statusLabels: Record<string, string> = {
  pending: "قيد النظر",
  under_investigation: "قيد التحقيق",
  in_court: "في المحكمة",
  resolved: "محلول",
  closed: "مغلق",
  active: "نشط",
  inactive: "غير نشط",
};

export default function AdvancedSearch() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "property",
    "case",
    "ruling",
    "deed",
    "instruction",
    "knowledge",
  ]);
  const [governorate, setGovernorate] = useState("");
  const [status, setStatus] = useState("");

  const { data: results, isLoading, refetch } = trpc.advancedSearch.advanced.useQuery(
    {
      query: searchQuery || undefined,
      types: selectedTypes.length > 0 ? (selectedTypes as any) : undefined,
      governorate: governorate || undefined,
      status: status || undefined,
      limit: 100,
    },
    {
      enabled: false, // Don't run automatically
    }
  );

  const handleSearch = () => {
    refetch();
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getTypeIcon = (type: string) => {
    const Icon = typeLabels[type]?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      property: "bg-blue-100 text-blue-800",
      case: "bg-amber-100 text-amber-800",
      ruling: "bg-purple-100 text-purple-800",
      deed: "bg-green-100 text-green-800",
      instruction: "bg-red-100 text-red-800",
      knowledge: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8" />
              البحث المتقدم
            </h1>
            <p className="text-muted-foreground mt-2">
              ابحث عبر جميع أنواع السجلات في النظام
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            العودة للوحة التحكم
          </Button>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle>معايير البحث</CardTitle>
            <CardDescription>حدد معايير البحث والفلاتر المطلوبة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Query */}
            <div className="space-y-2">
              <Label htmlFor="search">كلمة البحث</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="ابحث في جميع الحقول..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <Search className="ml-2 h-4 w-4" />
                      بحث
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-3">
              <Label>أنواع السجلات</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(typeLabels).map(([type, { label, icon: Icon }]) => (
                  <div
                    key={type}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTypes.includes(type)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleType(type)}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="governorate">المحافظة</Label>
                <Input
                  id="governorate"
                  placeholder="مثال: القدس، نابلس، الخليل..."
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Input
                  id="status"
                  placeholder="مثال: نشط، قيد النظر، محلول..."
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>النتائج</CardTitle>
              <CardDescription>
                تم العثور على {results.total} نتيجة
                {searchQuery && ` لكلمة "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.results.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">لا توجد نتائج</p>
                  <p className="text-muted-foreground mt-2">
                    جرب تغيير معايير البحث أو الفلاتر
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.results.map((result: any, index: number) => (
                    <Card
                      key={`${result.type}-${result.id}-${index}`}
                      className="cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => navigate(result.url)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(result.type)}
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(
                                  result.type
                                )}`}
                              >
                                {typeLabels[result.type]?.label}
                              </span>
                              {result.status && (
                                <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                                  {statusLabels[result.status] || result.status}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold">{result.title}</h3>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                            )}
                            {result.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            {result.governorate && (
                              <p className="text-xs text-muted-foreground">
                                المحافظة: {result.governorate}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              تاريخ الإنشاء:{" "}
                              {new Date(result.createdAt).toLocaleDateString("ar-EG")}
                            </p>
                          </div>
                          <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
