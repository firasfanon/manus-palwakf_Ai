import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  FileText,
  Gavel,
  ScrollText,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Scale,
  FileCheck,
  Search,
  Settings,
  FolderOpen,
} from "lucide-react";
import { useLocation } from "wouter";

const propertyTypeLabels: Record<string, string> = {
  mosque: "مسجد",
  cemetery: "مقبرة",
  agricultural_land: "أرض زراعية",
  commercial: "تجاري",
  residential: "سكني",
  school: "مدرسة",
  clinic: "عيادة",
  other: "أخرى",
};

const statusLabels: Record<string, string> = {
  pending: "قيد النظر",
  under_investigation: "قيد التحقيق",
  in_court: "في المحكمة",
  resolved: "محلول",
  closed: "مغلق",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: dashboardStats, isLoading } = trpc.dashboard.stats.useQuery();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
        <Button onClick={() => navigate("/")}>العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  const stats = [
    {
      title: "العقارات الوقفية",
      value: dashboardStats?.totals.properties || 0,
      icon: Building2,
      description: "إجمالي العقارات المسجلة",
      href: "/admin/properties",
      color: "text-blue-600",
    },
    {
      title: "القضايا",
      value: dashboardStats?.totals.cases || 0,
      icon: Gavel,
      description: "القضايا النشطة والمغلقة",
      href: "/admin/cases",
      color: "text-amber-600",
    },
    {
      title: "الأحكام القضائية",
      value: dashboardStats?.totals.rulings || 0,
      icon: Scale,
      description: "الأحكام المسجلة",
      href: "/admin/rulings",
      color: "text-purple-600",
    },
    {
      title: "الحجج الوقفية",
      value: dashboardStats?.totals.deeds || 0,
      icon: FileCheck,
      description: "الحجج والوثائق",
      href: "/admin/deeds",
      color: "text-green-600",
    },
    {
      title: "التعليمات الوزارية",
      value: dashboardStats?.totals.instructions || 0,
      icon: ScrollText,
      description: "التعليمات والقرارات",
      href: "/admin/instructions",
      color: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-2">
              مرحباً {user.name}، هذه نظرة عامة على النظام
            </p>
          </div>
          <Button onClick={() => navigate("/chat")}>
            <BarChart3 className="ml-2 h-4 w-4" />
            المساعد الذكي
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => navigate(stat.href)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Properties by Governorate */}
          <Card>
            <CardHeader>
              <CardTitle>التوزيع الجغرافي للعقارات</CardTitle>
              <CardDescription>عدد العقارات حسب المحافظة</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dashboardStats?.propertiesByGovernorate && dashboardStats.propertiesByGovernorate.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.propertiesByGovernorate
                    .sort((a, b) => (b.count as number) - (a.count as number))
                    .map((item) => (
                      <div key={item.governorate} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.governorate}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{
                              width: `${
                                ((item.count as number) /
                                  Math.max(...dashboardStats.propertiesByGovernorate.map((i) => i.count as number))) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>

          {/* Cases by Status */}
          <Card>
            <CardHeader>
              <CardTitle>حالات القضايا</CardTitle>
              <CardDescription>توزيع القضايا حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dashboardStats?.casesByStatus && dashboardStats.casesByStatus.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.casesByStatus
                    .sort((a, b) => (b.count as number) - (a.count as number))
                    .map((item) => (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{statusLabels[item.status] || item.status}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`rounded-full h-2 transition-all ${
                              item.status === "resolved"
                                ? "bg-green-500"
                                : item.status === "in_court"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width: `${
                                ((item.count as number) /
                                  Math.max(...dashboardStats.casesByStatus.map((i) => i.count as number))) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties by Type */}
        <Card>
          <CardHeader>
            <CardTitle>أنواع العقارات الوقفية</CardTitle>
            <CardDescription>توزيع العقارات حسب النوع</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : dashboardStats?.propertiesByType && dashboardStats.propertiesByType.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardStats.propertiesByType
                  .sort((a, b) => (b.count as number) - (a.count as number))
                  .map((item) => (
                    <div key={item.propertyType} className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{item.count}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {propertyTypeLabels[item.propertyType] || item.propertyType}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>الوصول السريع للعمليات الشائعة</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/properties")}
            >
              <Building2 className="h-5 w-5" />
              <span>إدارة العقارات</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/cases")}
            >
              <Gavel className="h-5 w-5" />
              <span>إدارة القضايا</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/rulings")}
            >
              <Scale className="h-5 w-5" />
              <span>إدارة الأحكام</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/deeds")}
            >
              <FileCheck className="h-5 w-5" />
              <span>إدارة الحجج</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/instructions")}
            >
              <ScrollText className="h-5 w-5" />
              <span>إدارة التعليمات</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/knowledge")}
            >
              <FileText className="h-5 w-5" />
              <span>المكتبة المعرفية</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
              <span>البحث المتقدم</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/settings")}
            >
              <Settings className="h-5 w-5" />
              <span>إعدادات الموقع</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/admin/files")}
            >
              <FolderOpen className="h-5 w-5" />
              <span>إدارة الملفات</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
